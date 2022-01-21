import { BlobBuffer, BulkWriteRow, ChangeStreamOnceOptions, EventBulk, MangoQuery, RxDocumentData, RxJsonSchema, RxStorageBulkWriteResponse, RxStorageChangedDocumentMeta, RxStorageChangeEvent, RxStorageInstance, RxStorageInstanceCreationParams, RxStorageQueryResult } from "rxdb/dist/types/types";
import { Observable } from "rxjs";
import { BrowserStorageInternals, IdbSettings } from "./types/browser-storage";
export declare class RxStorageBrowserInstance<RxDocType> implements RxStorageInstance<RxDocType, BrowserStorageInternals, IdbSettings> {
    readonly databaseName: string;
    readonly collectionName: string;
    readonly options: Readonly<IdbSettings>;
    readonly schema: Readonly<RxJsonSchema<RxDocType>>;
    readonly internals: BrowserStorageInternals;
    private changes$;
    readonly instanceId: number;
    private closed;
    private lastChangefeedSequence;
    constructor(databaseName: string, collectionName: string, options: Readonly<IdbSettings>, schema: Readonly<RxJsonSchema<RxDocType>>, internals: BrowserStorageInternals);
    query(preparedQuery: MangoQuery<RxDocType>): Promise<RxStorageQueryResult<RxDocType>>;
    bulkWrite(documentWrites: BulkWriteRow<RxDocType>[], hardDeleteMode?: boolean): Promise<RxStorageBulkWriteResponse<RxDocType>>;
    bulkAddRevisions(documents: RxDocumentData<RxDocType>[]): Promise<void>;
    findDocumentsById(ids: string[], deleted: boolean): Promise<{
        [documentId: string]: RxDocumentData<RxDocType>;
    }>;
    getChangedDocuments(options: ChangeStreamOnceOptions): Promise<{
        changedDocuments: RxStorageChangedDocumentMeta[];
        lastSequence: number;
    }>;
    changeStream(): Observable<EventBulk<RxStorageChangeEvent<RxDocumentData<RxDocType>>>>;
    getAttachmentData(_documentId: string, _attachmentId: string): Promise<BlobBuffer>;
    close(): Promise<void>;
    remove(): Promise<void>;
    private getLocalState;
    private getChangesCollectionName;
    /**
     * Adds an entry to the changes feed
     * that can be queried to check which documents have been
     * changed since sequence X.
     */
    private addChangeDocumentMeta;
}
export declare const createBrowserStorageLocalState: <RxDocType>(params: RxStorageInstanceCreationParams<RxDocType, IdbSettings>, idbSettings: IdbSettings) => Promise<BrowserStorageInternals>;
export declare const createBrowserStorageInstance: <RxDocType>(_params: RxStorageInstanceCreationParams<RxDocType, IdbSettings>, idbSettings: IdbSettings) => Promise<RxStorageBrowserInstance<RxDocType>>;
