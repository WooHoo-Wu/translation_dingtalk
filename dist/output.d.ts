import { OutputInter } from "./model";
export declare class TOutput {
    private init;
    private api;
    constructor(_i: OutputInter);
    private log;
    private get isTs();
    delAllSheet(): Promise<void>;
    run(): Promise<void>;
    private getAllFile;
    private createSheet;
    private getFileCont;
    private getOriginData;
}
