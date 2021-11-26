import { BulkWriteLocalRow, RxKeyObjectStorageInstanceCreationParams, RxLocalDocumentData, RxLocalStorageBulkWriteResponse, RxStorageChangeEvent, RxStorageKeyObjectInstance } from "rxdb/dist/types/types";
import { Observable } from "rxjs";
import { BrowserStorageInternals, BrowserStorageSettings } from "./types/browser-storage";
export declare class RxStorageKeyObjectInstanceLoki<RxDocType> implements RxStorageKeyObjectInstance<BrowserStorageInternals, BrowserStorageSettings> {
    readonly databaseName: string;
    readonly collectionName: string;
    readonly options: Readonly<BrowserStorageSettings>;
    readonly internals: BrowserStorageInternals;
    private changes$;
    readonly instanceId: number;
    private closed;
    constructor(databaseName: string, collectionName: string, options: Readonly<BrowserStorageSettings>, internals: BrowserStorageInternals);
    bulkWrite<RxDocType>(documentWrites: BulkWriteLocalRow<RxDocType>[]): Promise<RxLocalStorageBulkWriteResponse<RxDocType>>;
    findLocalDocumentsById<RxDocType = any>(ids: string[]): Promise<Map<string, RxLocalDocumentData<RxDocType>>>;
    changeStream(): Observable<RxStorageChangeEvent<RxLocalDocumentData<{
        [key: string]: any;
    }>>>;
    close(): Promise<void>;
    remove(): Promise<void>;
    private getLocalState;
}
export declare function createBrowserKeyValueStorageLocalState(params: RxKeyObjectStorageInstanceCreationParams<BrowserStorageSettings>): Promise<{
    databaseState: import("./types/browser-storeage-state").BrowserStorageState;
    primaryPath: string;
}>;
export declare const createBrowserKeyObjectStorageInstance: (params: RxKeyObjectStorageInstanceCreationParams<BrowserStorageSettings>) => Promise<RxStorageKeyObjectInstanceLoki<unknown>>;
