import { InputInter } from "./model";
export declare class TInput {
    private init;
    private api;
    private sheetId;
    private sheetName;
    private updateDateLen;
    private rangeAddr;
    constructor(_i: InputInter);
    run(): Promise<void>;
    private forAllSheet;
    /**
     * 遍历所有的语言类型，准备数据将数据写入文件
     * @param sheetData 待写入文件的数据，格式：双层数组，[表格行][表格列]，首列一定是key值
     */
    private setSheetData;
    /**
     * 将表格数据翻译整理，并且和原来的数据合并成一个json
     * @param {string[][]} sheetData 表格的数据，格式：双层数组，[表格行][表格列]，首行是翻译名称，例如：中文、英文...
     * @param {any} fileJson 原始数据，新增表格的话是{},更新就是有数据的
     * @param {number} langIndex sheetData 的列index，代表的是什么语言
     */
    private setDataToFile;
    /**
     * 将一个 'aa.bb.cc': 'dd' 的数据转换成 {aa: { bb: { cc: dd } }} 的数据格式
     * @param {string[]} keys JSON对象的key名称，是个列表，['xx', 'bb']
     * @param {string} value 值
     * @returns {object}，keys.length 层
     */
    private getObjectVal;
    /**
     * 将表格数据回填到表格中
     * @param sheetData 表格数据
     */
    private updateDataToSheet;
    /**
     * 将输入的行数，转换成地址数组
     * @returns {string[]} 获取表格信息的地址，格式 {首列}{首行}:{尾列}{尾行}[]
     */
    private getRang;
    /**
     * 获取表格信息
     * @param sheet 表格信息
     * @returns
     */
    private getSheetData;
    private log;
    private get isTs();
    /**
     * 没有key的情况下，自动生成key值
     * @param originJson 原始JSON数据，用于判断key是否重复
     * @param srcText 根据该文案生成key值
     * @returns key 值
     */
    private getKeyNameForGpt;
    private googleTranslate;
    private handleTranslateOfVariables;
    private get keyIndex();
    private gptKey;
    private getLangIndex;
    private getLangNameForIndex;
}
