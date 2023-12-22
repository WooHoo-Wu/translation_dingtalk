/**
 * 钉钉接口API
 */
import axios from "axios";
import Translate from "@google-cloud/translate";
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from "openai";
import { TranslationConfig } from "./model";

export class TApi {
    private workbookId = "";
    private operatorId = "";
    private accessToken = "";
    private translate;
    private config: TranslationConfig;
    constructor(config: TranslationConfig) {
        this.config = config;
        this.workbookId = this.config.workBookId;
        this.operatorId = this.config.operatorId;
        this.translate = new Translate.v2.Translate({ projectId: this.config.translate.projectId, key: this.config.translate.key });
    }

    // 获取token
    public getAccessToken = () => {
        if (this.accessToken) return;
        return new Promise<void>((resolve, reject) => {
            axios
                .request({
                    url: "https://api.dingtalk.com/v1.0/oauth2/accessToken",
                    headers: {
                        "Content-Type": "application/json;",
                    },
                    method: "post",
                    data: {
                        appKey: this.config.appKey,
                        appSecret: this.config.appSecret,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.accessToken) {
                        this.accessToken = res.data.accessToken;
                        console.log("accessToken: ", this.accessToken);
                    }
                    resolve();
                })
                .catch(() => {
                    console.log(123);
                    reject();
                });
        });
    };
    // 创建工作表
    public createSheet = (name: string) => {
        return new Promise<any>((resolve, reject) => {
            axios
                .request({
                    url: `https://api.dingtalk.com//v1.0/doc/workbooks/${this.workbookId}/sheets?operatorId=${this.operatorId}`,
                    headers: {
                        "Content-Type": "application/json;",
                        "x-acs-dingtalk-access-token": this.accessToken,
                    },
                    method: "post",
                    data: {
                        name,
                    },
                })
                .then((res) => {
                    if (res.data) {
                        resolve(res.data);
                    }
                })
                .catch((err: any) => {
                    console.log(234);
                    reject(err);
                });
        });
    };
    // 获取所有的工作表
    public getSheetAll = () => {
        return new Promise<any>((resolve, reject) => {
            axios
                .request({
                    url: `https://api.dingtalk.com/v1.0/doc/workbooks/${this.workbookId}/sheets?operatorId=${this.operatorId}`,
                    headers: {
                        "Content-Type": "application/json;",
                        "x-acs-dingtalk-access-token": this.accessToken,
                    },
                    method: "get",
                })
                .then((res) => {
                    if (res.data) {
                        resolve(res.data);
                    }
                })
                .catch((err: any) => {
                    reject(err);
                });
        });
    };
    // 删除指定的工作表
    public delSheet = (id: string) => {
        return new Promise((resolve, reject) => {
            axios
                .request({
                    url: `https://api.dingtalk.com/v1.0/doc/workbooks/${this.workbookId}/sheets/${id}?operatorId=${this.operatorId}`,
                    headers: {
                        "Content-Type": "application/json;",
                        "x-acs-dingtalk-access-token": this.accessToken,
                    },
                    method: "delete",
                })
                .then((res) => {
                    if (res.data) {
                        resolve(res.data);
                    }
                })
                .catch((err: any) => {
                    reject(err);
                });
        });
    };
    // 根据sheetId获取工作表
    public getSheetData = (id: string) => {
        return new Promise<any>((resolve, reject) => {
            axios
                .request({
                    url: `https://api.dingtalk.com/v1.0/doc/workbooks/${this.workbookId}/sheets/${id}?operatorId=${this.operatorId}`,
                    headers: {
                        "Content-Type": "application/json;",
                        "x-acs-dingtalk-access-token": this.accessToken,
                    },
                    method: "get",
                })
                .then((res) => {
                    if (res.data) {
                        resolve(res.data);
                    }
                })
                .catch((err: any) => {
                    reject(err);
                });
        });
    };
    // 获取单元格区域的内容
    public getCellData = (sheetId: string, rangeAddress: string, select = "values") => {
        return new Promise<any>((resolve, reject) => {
            axios
                .request({
                    url: `https://api.dingtalk.com/v1.0/doc/workbooks/${this.workbookId}/sheets/${sheetId}/ranges/${rangeAddress}?operatorId=${this.operatorId}&select=${select}`,
                    headers: {
                        "Content-Type": "application/json;",
                        "x-acs-dingtalk-access-token": this.accessToken,
                    },
                    method: "get",
                })
                .then((res) => {
                    if (res.data) {
                        resolve(res.data);
                    }
                })
                .catch((err: any) => {
                    reject(err);
                });
        });
    };
    // 更新单元格区域数据
    public updateCellData = (sheetId: string, rangeAddress: string, values: string[][]) => {
        return new Promise((resolve, reject) => {
            axios
                .request({
                    url: `https://api.dingtalk.com/v1.0/doc/workbooks/${this.workbookId}/sheets/${sheetId}/ranges/${rangeAddress}?operatorId=${this.operatorId}`,
                    headers: {
                        "Content-Type": "application/json;",
                        "x-acs-dingtalk-access-token": this.accessToken,
                    },
                    method: "put",
                    data: {
                        values,
                    },
                })
                .then((res) => {
                    if (res.data) {
                        resolve(res.data);
                    }
                })
                .catch((err: any) => {
                    console.log(34);
                    reject(err);
                });
        });
    };
    // 谷歌翻译
    public googleTr = async (text: string, target: string, from = "en-US") => {
        const [translation] = await this.translate.translate(text, {
            from: from,
            to: target,
            format: "text",
        });
        return translation;
    };
    /**
     * 通过chatGpt 生成文案的key
     */
    public getTransKey = async (text: string) => {
        try {
            const configuration = new Configuration({ apiKey: this.config.gptKey });
            const openai = new OpenAIApi(configuration);
            const messages: ChatCompletionRequestMessage[] = [
                {
                    role: "system",
                    content: "给这段话起一个小于18个字母的英文名称，按照大驼峰命名规范。",
                },
                {
                    role: "user",
                    content: text,
                },
            ];
            const completion = await openai.createChatCompletion({
                model: this.config.gptModel || "gpt-3.5-turbo",
                messages,
            });
            return completion.data.choices[0].message?.content;
        } catch (error) {
            return "";
        }
    };
}
