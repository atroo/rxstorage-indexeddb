import { BlobBuffer, BulkWriteRow, ChangeStreamOnceOptions, MangoQuery, RxDocumentData, RxDocumentWriteData, RxJsonSchema, RxStorageBulkWriteResponse, RxStorageChangedDocumentMeta, RxStorageChangeEvent, RxStorageInstance, RxStorageInstanceCreationParams, RxStorageQueryResult } from "rxdb/dist/types/types";
import { Observable } from "rxjs";
import { BrowserStorageInternals, BrowserStorageSettings } from "./types/browser-storage";
import { DeterministicSortComparator, QueryMatcher } from "event-reduce-js/dist/lib/types";
export declare class RxStorageBrowserInstance<RxDocType> implements RxStorageInstance<RxDocType, BrowserStorageInternals, BrowserStorageSettings> {
    readonly databaseName: string;
    readonly collectionName: string;
    readonly options: Readonly<BrowserStorageSettings>;
    readonly schema: Readonly<RxJsonSchema<RxDocType>>;
    readonly internals: BrowserStorageInternals;
    private changes$;
    readonly instanceId: number;
    private closed;
    private lastChangefeedSequence;
    constructor(databaseName: string, collectionName: string, options: Readonly<BrowserStorageSettings>, schema: Readonly<RxJsonSchema<RxDocType>>, internals: BrowserStorageInternals);
    prepareQuery(mutateableQuery: MangoQuery<RxDocType>): MangoQuery<RxDocType>;
    getSortComparator(query: MangoQuery<RxDocType>): DeterministicSortComparator<RxDocType>;
    getQueryMatcher(query: MangoQuery<RxDocType>): QueryMatcher<RxDocumentWriteData<RxDocType>>;
    query(preparedQuery: MangoQuery<RxDocType>): Promise<RxStorageQueryResult<RxDocType>>;
    bulkWrite(documentWrites: BulkWriteRow<RxDocType>[]): Promise<RxStorageBulkWriteResponse<RxDocType>>;
    bulkAddRevisions(documents: RxDocumentData<RxDocType>[]): Promise<void>;
    findDocumentsById(ids: string[], deleted: boolean): Promise<Map<string, RxDocumentData<RxDocType>>>;
    getChangedDocuments(options: ChangeStreamOnceOptions): Promise<{
        changedDocuments: RxStorageChangedDocumentMeta[];
        lastSequence: number;
    }>;
    changeStream(): Observable<RxStorageChangeEvent<RxDocumentData<RxDocType>>>;
    getAttachmentData(_documentId: string, _attachmentId: string): Promise<BlobBuffer>;
    close(): Promise<void>;
    remove(): Promise<void>;
    private getLocalState;
    /**
     * Adds an entry to the changes feed
     * that can be queried to check which documents have been
     * changed since sequence X.
     */
    private addChangeDocumentMeta;
}
export declare const createBrowserStorageLocalState: <RxDocType>(params: RxStorageInstanceCreationParams<RxDocType, BrowserStorageSettings>) => Promise<{
    databaseState: import("./types/browser-storeage-state").BrowserStorageState;
    primaryPath: string;
}>;
export declare const createBrowserStorageInstance: <RxDocType>(params: RxStorageInstanceCreationParams<RxDocType, BrowserStorageSettings>) => Promise<RxStorageBrowserInstance<RxDocType>>;
