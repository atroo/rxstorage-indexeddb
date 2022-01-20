import { BulkWriteLocalRow, EventBulk, RxKeyObjectStorageInstanceCreationParams, RxLocalDocumentData, RxLocalStorageBulkWriteResponse, RxStorageChangeEvent, RxStorageKeyObjectInstance } from "rxdb/dist/types/types";
import { Observable } from "rxjs";
import { BrowserStorageInternals, IdbSettings } from "./types/browser-storage";
export declare class RxBrowserKeyObjectStorageInstance<RxDocType> implements RxStorageKeyObjectInstance<BrowserStorageInternals, IdbSettings> {
    readonly databaseName: string;
    readonly collectionName: string;
    readonly options: Readonly<IdbSettings>;
    readonly internals: BrowserStorageInternals;
    private changes$;
    readonly instanceId: number;
    private closed;
    constructor(databaseName: string, collectionName: string, options: Readonly<IdbSettings>, internals: BrowserStorageInternals);
    bulkWrite<RxDocType>(documentWrites: BulkWriteLocalRow<RxDocType>[]): Promise<RxLocalStorageBulkWriteResponse<RxDocType>>;
    findLocalDocumentsById<RxDocType = any>(ids: string[]): Promise<{
        [documentId: string]: RxLocalDocumentData<RxDocType>;
    }>;
    changeStream(): Observable<EventBulk<RxStorageChangeEvent<RxLocalDocumentData<{
        [key: string]: any;
    }>>>>;
    close(): Promise<void>;
    remove(): Promise<void>;
    private getLocalState;
}
export declare function createBrowserKeyValueStorageLocalState(params: RxKeyObjectStorageInstanceCreationParams<IdbSettings>, idbSettings: IdbSettings): Promise<BrowserStorageInternals>;
export declare const createBrowserKeyObjectStorageInstance: <RxDocType>(_params: RxKeyObjectStorageInstanceCreationParams<IdbSettings>, idbSettings: IdbSettings) => Promise<RxBrowserKeyObjectStorageInstance<RxDocType>>;
