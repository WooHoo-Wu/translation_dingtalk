import path from "path";
import fs from "fs";
import { OutputInter } from "./model";
import { TApi } from "./api";
import * as color from "colors";

type ConsoleColor = "yellow" | "red" | "blue" | "";

export class TOutput {
    private init: OutputInter;
    private api: TApi;

    constructor(_i: OutputInter) {
        this.init = _i;
        this.init.sysConfig.setMaxNum = this.init.sysConfig.setMaxNum || 400;
        this.init.translateOrigin = this.init.translateOrigin || "en-US";
        this.api = new TApi(this.init.sysConfig);
        color.enable();
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

    // 删除所有表格
    public async delAllSheet() {
        try {
            // 获取token
            await this.api.getAccessToken();
            // 获取所有的工作表
            const data = await this.api.getSheetAll();
            if (data.value && data.value.length > 0) {
                for (const sheet of data.value) {
                    if (this.init.skipSheetNameList?.includes(sheet.name)) continue;
                    await this.api.delSheet(sheet.id);
                    this.log(`删除${sheet.name}成功！`, "blue");
                }
            }
        } catch (error) {
            console.error("删除表出错了：", error);
        }
    }

    public async run() {
        try {
            await this.getAllFile();
        } catch (error) {
            this.log("执行失败", "red");
            console.log(error);
        }
    }

    private async getAllFile() {
        const defaultLangPath = path.resolve(this.init.sysConfig.localePath, this.init.translateOrigin);
        if (!fs.existsSync(defaultLangPath)) {
            this.log(`${defaultLangPath} 路径找不到`, "red");
            return;
        }
        const files = await fs.readdirSync(defaultLangPath);
        for (const file of files) {
            if (this.init.skipLangNameList?.includes(file)) continue;
            // 获取数据
            const data = await this.getFileCont(file);
            // 写入表格
            await this.createSheet(data, file.replace(this.isTs ? ".ts" : ".json", ""));
        }
    }

    private async createSheet(data: string[][], sheetName: string) {
        try {
            // 获取token
            await this.api.getAccessToken();
            // 创建表
            const cData = await this.api.createSheet(sheetName);
            const MAX = this.init.sysConfig.setMaxNum!;
            if (cData && cData.id) {
                const sheetId = cData.id;
                if (data.length > MAX) {
                    for (let i = 0; i < Math.ceil(data.length / MAX); i++) {
                        const temp = data.slice(i * MAX, (i + 1) * MAX);
                        const range = `${this.init.langConfig[0].cellKey}${i * MAX + 1}:${this.init.langConfig[this.init.langConfig.length - 1].cellKey}${i * MAX + temp.length}`;
                        this.log(`${sheetName}表写入数据${range}, ${temp.length}条数据`);
                        await this.api.updateCellData(sheetId, range, temp);
                    }
                } else {
                    // 将数据写入表格
                    const range = `${this.init.langConfig[0].cellKey}1:${this.init.langConfig[this.init.langConfig.length - 1].cellKey}${data.length}`;
                    this.log(`${sheetName}表写入数据${range}, ${data.length}条数据`);
                    await this.api.updateCellData(sheetId, range, data);
                }
            } else {
                this.log("创建表格失败", "red");
                return;
            }
        } catch (error) {
            this.log("创建表出错了", "red");
            console.log(error);
        }
    }

    private async getFileCont(filename: string) {
        let count = 1;
        const res: string[][] = []; // 行、列
        const keyIndexObj: Record<string, number> = {}; // 记录key值的位置
        const sheetHeaderData = this.init.langConfig.map((el) => el.text);
        res[0] = sheetHeaderData;
        for (const lang of this.init.langConfig) {
            if (!lang.dirText || !lang.value) continue;
            // 获取翻译路径
            const langPath = path.resolve(this.init.sysConfig.localePath, lang.dirText, filename);
            if (!fs.existsSync(langPath)) continue;
            const fileContent = await require(langPath);
            const originData: any = {};
            this.getOriginData(originData, fileContent.default, "");
            Object.keys(originData).forEach((el: string) => {
                if (keyIndexObj.hasOwnProperty(el)) {
                    // 如果这个key已经存在了
                    if (!res[keyIndexObj[el]]) {
                        res[keyIndexObj[el]] = sheetHeaderData.map((el) => "");
                    }
                    res[keyIndexObj[el]][count] = originData[el];
                    res[keyIndexObj[el]][0] = el;
                } else {
                    // 不存在这个key
                    const l = Object.keys(keyIndexObj).length;
                    if (!res[l + 1]) {
                        res[l + 1] = sheetHeaderData.map((el) => "");
                    }
                    res[l + 1][count] = originData[el];
                    res[l + 1][0] = el;
                    keyIndexObj[el] = l + 1;
                }
            });
            count++;
        }
        return res;
    }

    // 将JSON数据扁平化
    private getOriginData(res: any, data: Record<string, any>, originKey: string) {
        Object.keys(data).forEach((key) => {
            if (Object.prototype.toString.call(data[key]) === "[object Object]") {
                if (originKey) {
                    return this.getOriginData(res, data[key], `${originKey}.${key}`);
                } else {
                    return this.getOriginData(res, data[key], key);
                }
            } else {
                if (originKey) {
                    res[`${originKey}.${key}`] = JSON.stringify(data[key]);
                } else {
                    res[key] = JSON.stringify(data[key]);
                }
            }
        });
    }
}
