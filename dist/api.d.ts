import { TranslationConfig } from "./model";
export declare class TApi {
    private workbookId;
    private operatorId;
    private accessToken;
    private translate;
    private config;
    constructor(config: TranslationConfig);
    getAccessToken: () => Promise<void>;
    createSheet: (name: string) => Promise<any>;
    getSheetAll: () => Promise<any>;
    delSheet: (id: string) => Promise<unknown>;
    getSheetData: (id: string) => Promise<any>;
    getCellData: (sheetId: string, rangeAddress: string, select?: string) => Promise<any>;
    updateCellData: (sheetId: string, rangeAddress: string, values: string[][]) => Promise<unknown>;
    googleTr: (text: string, target: string, from?: string) => Promise<any>;
    /**
     * 通过chatGpt 生成文案的key
     */
    getTransKey: (text: string) => Promise<string>;
}
