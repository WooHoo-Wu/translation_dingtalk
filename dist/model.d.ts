export declare enum OptionType {
    "UPDATE" = "1",
    "CREATE" = "2",
    "ADD_LANG" = "3"
}
export interface TranslationConfig {
    /**
     * @example
     * 翻译目录的结构：
     * localePath
     *      - 某个语言目录(dirText)，例如en-US
     *          - 具体的翻译文件，支持两种格式
     *          - sheetPageName.ts
     *          - sheetPageName.json
     */
    localePath: string;
    workBookId: string;
    operatorId: string;
    appKey: string;
    appSecret: string;
    translate: {
        projectId: string;
        key: string;
    };
    gptKey: string;
    gptModel?: string;
    setMaxNum?: number;
}
export interface TranslationLangConfig {
    text: string;
    value: string;
    dirText: string;
    cellKey: string;
}
export interface BaseInter {
    sysConfig: TranslationConfig;
    /**
     * 其中第一个必须是key值，后面才陆续是语言
     * key值的value是空的，dirText也是空的
     * @example
     * {
     *      text: 'key值',
     *      value: '',
     *      dirText: '',
     *      cellKey: 'F'
     * }
     */
    langConfig: TranslationLangConfig[];
    /**
     * 翻译文件的格式，目前支持两种ts ｜ json
     */
    fileType: "ts" | "json";
}
export interface InputInter extends BaseInter {
    /**
     * @description 翻译脚本的操作类型
     * @default '1' 推荐
     * 1: 批量修改，
     * 2: 全部文档更新，这是一个高危操作，一般只在项目初始化的时候用到这个选项
     * 3: 新增语言类型，新增语言类型也会更新整个文档
     */
    optType: OptionType;
    /**
     * @description 指定想要操作 那些工作表分页的名称，也对应的是翻译的文件名称
     * 只有在 optType 为 '1' 的时候生效
     */
    sheetPageName?: string;
    /**
     * @description 指定更新工作表分页中的指定文案，多个文案用,连接，连续使用-连接
     * @example
     *  23,45,235
     *  23,34-45,66
     * 只有在 optType 为 '1' 的时候生效
     */
    sheetPageLines?: string;
    /**
     * 需要跳过的sheet表的名称
     */
    skipSheetNameList?: string[];
    /**
     * 新增语言的列表
     * 1. 只有在 optType 为 '3'的时候生效
     * 2. 新增的语言简码，需要和langConfig 中的value对应
     */
    newLangCodeList?: string[];
    /**
     * 翻译的原型语言, 需要和langConfig 中的value对应
     * 在output中，这个语言作为循环文件的主文件
     * @default 'en-US'
     */
    translateOrigin?: string;
    /**
     * 特殊的翻译群体，使用数组的第一个作为翻译成的语言，数组的第二个作为目标翻译语言
     * 需要和langConfig 中的value对应
     * @example
     * [['zh-TW', 'xx'], 'zh-CN'] 代表['zh-TW', 'xx']使用zh-CN作为母语翻译
     */
    translateSpecial?: [string[], string][];
    /**
     * 跳过需要要翻译的语言
     * 需要和langConfig 中的value对应
     */
    skipTranslateLangList?: string[];
    /**
     * gpt生成key值，对应langConfig数组的下标
     * @default {number[]} [1,2] 备注：一般来说，1是中文，2是英文
     */
    gptGenerateKey?: number[];
}
export interface OutputInter extends BaseInter {
    /**
     * 翻译的原型语言, 需要和langConfig 中的value对应
     * 在output中，这个语言作为循环文件的主文件
     * @default 'en-US'
     */
    translateOrigin?: string;
    /**
     * 需要跳过的翻译文件名称, 仅在output方法中有作用
     * @example
     * ['index.ts']
     * ['index.json']
     */
    skipLangNameList?: string[];
    /**
     * 需要跳过的sheet表的名称
     */
    skipSheetNameList?: string[];
}
