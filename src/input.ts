// 将钉钉文档的翻译读取，并写入到指定地址
import * as color from "colors";
import { InputInter, OptionType } from "./model";
import { TApi } from "./api";
import path from "path";
import fs from "fs";
import _ from "lodash";

type ConsoleColor = "yellow" | "red" | "blue" | "";

export class TInput {
    private init: InputInter;
    private api: TApi;

    private sheetId: string = "";
    private sheetName: string = "";

    private updateDateLen: number = 0;

    private rangeAddr: string[] = []; // 更新表格的范围，多段

    constructor(_i: InputInter) {
        this.init = _i;
        this.init.sysConfig.setMaxNum = this.init.sysConfig.setMaxNum || 400;
        this.api = new TApi(this.init.sysConfig);
        color.enable();
    }

    public async run() {
        try {
            await this.api.getAccessToken();
            await this.forAllSheet();
            this.log(`总更新数据量：${this.updateDateLen}条`, "blue");
        } catch (error) {
            this.log("获取数据失败", "red");
            console.log(error);
        }
    }

    private async forAllSheet() {
        // 获取所有的工作表数据
        const data = await this.api.getSheetAll();
        if (data.value && data.value.length > 0) {
            let execTime = 0;
            for (const sheet of data.value) {
                if (this.init.skipSheetNameList?.includes(sheet.name)) continue;
                if (this.init.optType === OptionType.UPDATE) {
                    if (this.init.sheetPageName !== sheet.name) continue;
                }
                execTime += 1;
                const sheetData = await this.getSheetData(sheet);
                if (sheetData && sheetData.length > 0) {
                    await this.setSheetData(sheetData);
                }
            }
            if (execTime === 0) {
                this.log("请检查表格分页的名称是否拼写正确", "yellow");
            }
        } else {
            this.log("没有数据", "yellow");
        }
    }

    /**
     * 遍历所有的语言类型，准备数据将数据写入文件
     * @param sheetData 待写入文件的数据，格式：双层数组，[表格行][表格列]，首列一定是key值
     */
    private async setSheetData(sheetData: string[][]) {
        if (this.init.optType === OptionType.UPDATE) {
            const _arr = this.init.langConfig.map((el) => el.text);
            sheetData.unshift(_arr);
        }
        // 每个sheet的第0行都是语言行
        if (sheetData[0] && sheetData[0].length > 0) {
            for (let i = 1; i < this.init.langConfig.length; i++) {
                const _lang = this.init.langConfig[i];
                if (this.init.optType === OptionType.ADD_LANG) {
                    // 新增语言, 将首行的文案(标题)写进表格
                    sheetData[0][i] = _lang.text;
                    if (!this.init.newLangCodeList.includes(_lang.value)) continue;
                }
                // 查找项目目录
                const _langPath = path.resolve(this.init.sysConfig.localePath, _lang.dirText);
                if (!fs.existsSync(_langPath)) {
                    await fs.mkdirSync(_langPath, { recursive: true });
                }
                const _filePath = path.resolve(_langPath, `${this.sheetName}.${this.isTs ? "ts" : "json"}`);
                if (!fs.existsSync(_filePath)) {
                    this.log(`找不到文件${this.sheetName}.${this.isTs ? "ts" : "json"}, 注意是否引入该资源文件`, "red");
                    await fs.writeFileSync(_filePath, this.isTs ? `export default ${JSON.stringify({}, null, "\t")};` : JSON.stringify({}, null, "\t"));
                }
                const fileContent = await require(_filePath);
                const fileJson = this.isTs ? fileContent.default : fileContent;
                const originJson = JSON.stringify(fileJson);
                // 整合数据
                await this.setDataToFile(sheetData, fileJson, i);
                // 写入文件
                if (originJson !== JSON.stringify(fileJson)) {
                    await fs.writeFileSync(_filePath, `export default ${JSON.stringify(fileJson, null, "\t")};`);
                    this.log(`${_filePath}修改成功！`);
                }
            }
            // 回写数据到表格
            await this.updateDataToSheet(sheetData);
        }
    }
    /**
     * 将表格数据翻译整理，并且和原来的数据合并成一个json
     * @param {string[][]} sheetData 表格的数据，格式：双层数组，[表格行][表格列]，首行是翻译名称，例如：中文、英文...
     * @param {any} fileJson 原始数据，新增表格的话是{},更新就是有数据的
     * @param {number} langIndex sheetData 的列index，代表的是什么语言
     */
    private async setDataToFile(sheetData: string[][], fileJson: any, langIndex: number) {
        for (let i = 1; i < sheetData.length; i++) {
            // 处理key值
            let keys: string[] = []; // key的数组
            if (sheetData[i][0]) {
                keys = (sheetData[i][0] + "").split("."); // 第0列，是key值区域
                sheetData[i][0] = sheetData[i][0] + ""; // 为了处理key是数字的情况
            } else {
                const _k = await this.getKeyNameForGpt(fileJson, this.gptKey(sheetData[i]));
                keys = [_k];
                sheetData[i][this.keyIndex] = _k;
            }
            // 处理翻译，表格里面没有数据
            if (!sheetData[i][langIndex]) {
                // google 翻译
                sheetData[i][langIndex] = await this.googleTranslate(sheetData[i], langIndex);
            }
            // 将数据内容转成字符串
            if (typeof sheetData[i][langIndex] === "number") {
                sheetData[i][langIndex] = sheetData[i][langIndex] + "";
            }
            _.merge(fileJson, this.getObjectVal(keys, sheetData[i][langIndex]));
        }
    }
    /**
     * 将一个 'aa.bb.cc': 'dd' 的数据转换成 {aa: { bb: { cc: dd } }} 的数据格式
     * @param {string[]} keys JSON对象的key名称，是个列表，['xx', 'bb']
     * @param {string} value 值
     * @returns {object}，keys.length 层
     */
    private getObjectVal(keys: string[], value: string) {
        const res: any = {};
        const recursive = (obj: any, keys: string[], value: any) => {
            const key = keys.shift();
            if (!key) return;
            if (keys.length === 0) {
                obj[key] = value;
                return;
            }
            if (!obj[key]) {
                obj[key] = {};
            }
            recursive(obj[key], keys, value);
        };
        const parseVal = (value: string) => {
            // 这一步主要是翻译的时候，将变量 { ss ss }这种的变成 {ssss}这种，避免i18n渲染报错，导致页面白屏
            let temp = value.replace(/(?<=\{)(.*?)(?=\})/g, (match) => {
                return match.replace(/\s+/g, "");
            });
            try {
                return JSON.parse(temp);
            } catch (error) {
                // this.parseErrorTips.push(`${this.currentFileName}.${keys.join('.')}不是标准的JSON格式，需要确定是不是字符串`);
                return JSON.parse(JSON.stringify(temp));
            }
        };
        // return _.set(res, keys, parseVal(value));
        recursive(res, keys, parseVal(value.toString()));
        return res;
    }
    /**
     * 将表格数据回填到表格中
     * @param sheetData 表格数据
     */
    private async updateDataToSheet(sheetData: string[][]) {
        let setDataLenSum = 0;
        const MAX = this.init.sysConfig.setMaxNum!;
        if (this.init.optType === OptionType.UPDATE) {
            sheetData.shift();
        }
        for (const range of this.rangeAddr) {
            const rangeList = range.split(":");
            const firstRangeIndex = +rangeList[0].replace(this.init.langConfig[0].cellKey, "");
            const lastRangeIndex = +rangeList[1].replace(this.init.langConfig[this.init.langConfig.length - 1].cellKey, "");
            const setDataLen = lastRangeIndex - firstRangeIndex + 1;
            const rangeData = _.slice(sheetData, setDataLenSum, setDataLenSum + setDataLen);
            setDataLenSum += setDataLen;
            if (setDataLen > MAX) {
                let maxDataSlice = 0;
                this.log(`[回填数据-切片]: ${setDataLen}条数据。`, "yellow");
                for (let i = 0; i < Math.ceil(rangeData.length / MAX); i++) {
                    const data = _.slice(rangeData, maxDataSlice, maxDataSlice + MAX);
                    const rangeMax = `${this.init.langConfig[0].cellKey}${maxDataSlice + 1}:${this.init.langConfig[this.init.langConfig.length - 1].cellKey}${maxDataSlice + data.length}`;
                    maxDataSlice += data.length;
                    await this.api.updateCellData(this.sheetId, rangeMax, data);
                    this.log(`[回填数据-切片]: 已完成 ${maxDataSlice} 条数据。`);
                }
            } else {
                await this.api.updateCellData(this.sheetId, range, rangeData);
            }
            this.log(`[回填数据]: ${this.sheetName}表写入数据${range}, ${setDataLenSum}条数据`);
        }
    }
    /**
     * 将输入的行数，转换成地址数组
     * @returns {string[]} 获取表格信息的地址，格式 {首列}{首行}:{尾列}{尾行}[]
     */
    private getRang() {
        const lineList: number[] = [];
        for (const l of this.init.sheetPageLines!.split(",")) {
            if (l.includes("-")) {
                const _r = l.split("-");
                if (isNaN(Number(_r[0])) || isNaN(Number(_r[1])) || Number(_r[1]) < Number(_r[0])) return [];
                for (let i = Number(_r[0]); i <= Number(_r[1]); i++) {
                    lineList.push(i);
                }
            } else {
                if (isNaN(Number(l))) return [];
                lineList.push(Number(l));
            }
        }
        const sortedNumbers = Array.from(new Set(lineList.sort((a, b) => a - b)));
        const res: number[][] = [];
        let start = sortedNumbers[0];
        let end = start;
        for (let i = 1; i < sortedNumbers.length; i++) {
            if (sortedNumbers[i] === end + 1) {
                end = sortedNumbers[i];
            } else {
                // 不是连续的数字
                res.push([start, end]);
                start = sortedNumbers[i];
                end = start;
            }
        }
        // 处理最后一个范围
        res.push([start, end]);

        return res.map((el) => {
            return `${this.init.langConfig[0].cellKey}${el[0]}:${this.init.langConfig[this.init.langConfig.length - 1].cellKey}${el[1]}`;
        });
    }
    /**
     * 获取表格信息
     * @param sheet 表格信息
     * @returns
     */
    private async getSheetData(sheet: any) {
        this.sheetId = sheet.id;
        this.sheetName = sheet.name;
        const sheetInfo = await this.api.getSheetData(this.sheetId);
        if (sheetInfo.rowCount && sheetInfo.lastNonEmptyRow && sheetInfo.lastNonEmptyRow !== -1) {
            if (this.init.optType === OptionType.UPDATE) {
                // 不需要更新全部表格
                this.rangeAddr = this.getRang();
                if (this.rangeAddr.length === 0) {
                    this.log("更新范围填写有误", "yellow");
                    throw "更新范围填写有误";
                }
            } else {
                // 需要更新全部表格, 地址由 {首列}{首行}:{尾列}{尾行} 构成
                this.rangeAddr = [`${this.init.langConfig[0].cellKey}1:${this.init.langConfig[this.init.langConfig.length - 1].cellKey}${sheetInfo.lastNonEmptyRow + 1}`];
            }
            // 获取表格数据
            let values: string[][] = [];
            for (const _r of this.rangeAddr) {
                const sheetData = await this.api.getCellData(sheet.id, _r);
                values.push(...(sheetData.values as string[][]));
            }
            this.log(`${sheetInfo.name}表获取数据${JSON.stringify(this.rangeAddr)}, ${values.length}条数据`, "yellow");
            this.updateDateLen += values.length;
            return values;
        }
        return;
    }
    // 打印出不同的颜色
    private log(msg: string, color: ConsoleColor = "") {
        switch (color) {
            case "red":
                console.log(msg.red);
                break;
            case "blue":
                console.log(msg.blue);
                break;
            case "yellow":
                console.log(msg.yellow);
                break;
            default:
                console.log(msg);
        }
    }
    private get isTs() {
        return this.init.fileType === "ts";
    }
    /**
     * 没有key的情况下，自动生成key值
     * @param originJson 原始JSON数据，用于判断key是否重复
     * @param srcText 根据该文案生成key值
     * @returns key 值
     */
    private async getKeyNameForGpt(originJson: any, srcText: any) {
        let res = "";
        let index = 1;
        if (typeof srcText === "string") {
            const _temp = await this.api.getTransKey(srcText);
            if (typeof _temp === "string") {
                const _r = _temp.replace('"', "").replace('"', "").replace(".", "");
                if (!/^\w*$/g.test(_r)) {
                    this.log(`gpt自动生成变量名失败: ${_r}, 使用数字`, "yellow");
                    res = this.sheetName + index + "";
                    index += 1;
                } else {
                    res = this.sheetName + _r + "";
                }
            } else {
                this.log(`gpt自动生成变量名失败: ${_temp}, 使用数字`, "yellow");
                res = this.sheetName + index + "";
                index += 1;
            }
        }
        while (true) {
            if (!res || originJson.hasOwnProperty(res)) {
                res = this.sheetName + index + "";
                index += 1;
            } else {
                break;
            }
        }
        return res;
    }
    // 翻译
    private async googleTranslate(lineData: string[], langIndex: number) {
        try {
            let fromLang = this.init.translateOrigin || "en-US";
            const currentLang = this.getLangNameForIndex(langIndex);
            // 跳过不翻译的语言
            if (this.init.skipTranslateLangList && this.init.skipTranslateLangList.includes(currentLang)) return "";
            // 特殊指定翻译的来源
            if (this.init.translateSpecial) {
                const _r = this.init.translateSpecial.find((el) => el[0].includes(currentLang));
                if (_r) fromLang = _r[1];
            }
            if (!lineData[this.getLangIndex(fromLang)]) {
                fromLang = this.init.translateOrigin || "en-US";
            }
            try {
                const text = JSON.stringify(JSON.parse(lineData[this.getLangIndex(fromLang)]));
                return await this.handleTranslateOfVariables(text, this.getLangNameForIndex(langIndex), fromLang);
            } catch (error) {}
            return await this.handleTranslateOfVariables(lineData[this.getLangIndex(fromLang)], this.getLangNameForIndex(langIndex), fromLang);
        } catch (error) {
            this.log("google翻译失败", "red");
            return "";
        }
    }

    // 处理翻译里面有变量的情况
    private async handleTranslateOfVariables(srcText: string, targetLang: string, fromLang: string) {
        let text = srcText;
        const variablesList = srcText.match(/(?<=\{)(.*?)(?=\})/g);
        const variablesMap: any = {};
        if (variablesList && variablesList.length) {
            for (let i = 0; i < variablesList.length; i++) {
                variablesMap[`a_${i}`] = variablesList[i];
                text = text.replace(`{${variablesList[i]}}`, `{a_${i}}`);
            }
        }
        let resText = await this.api.googleTr(text, targetLang, fromLang);
        if (variablesList && variablesList.length) {
            for (let i = 0; i < variablesList.length; i++) {
                resText = resText.replace(`{a_${i}}`, `{${variablesList[i]}}`);
            }
        }
        return resText;
    }

    // key值列
    private get keyIndex() {
        for (let i = 0; i < this.init.langConfig.length; i++) {
            if (this.init.langConfig[i].value === "") {
                return i;
            }
        }
        return 0;
    }
    private gptKey(data: string[]) {
        const indexList = this.init.gptGenerateKey || [1, 2];
        for (const i of indexList) {
            if (!!data[i]) {
                return data[i];
            }
        }
        return "";
    }
    // 获取对应语言的下标
    private getLangIndex(lang: string) {
        for (let i = 0; i < this.init.langConfig.length; i++) {
            if (this.init.langConfig[i].value === lang) {
                return i;
            }
        }
        return 0;
    }
    // 根据下标获取对应的语言
    private getLangNameForIndex(index: number) {
        return this.init.langConfig[index].value;
    }
}
