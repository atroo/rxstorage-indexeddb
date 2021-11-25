import { RxErrorKey, RxErrorParameters } from "rxdb/dist/types/types";
export declare class RxError extends Error {
    code: RxErrorKey;
    message: string;
    parameters: RxErrorParameters;
    rxdb: true;
    constructor(code: RxErrorKey, message: string, parameters?: RxErrorParameters);
    get name(): string;
    toString(): string;
    get typeError(): boolean;
}
