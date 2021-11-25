import { MangoQuery, RxDocumentWriteData, RxJsonSchema, RxStorageInstance, RxStorageInstanceCreationParams } from "rxdb/dist/types/types";
import { BrowserStorageInternals, BrowserStorageSettings } from "./types/browser-storage";
import { DeterministicSortComparator, QueryMatcher } from "event-reduce-js/dist/lib/types";
export declare class RxStorageBrowserInstance<RxDocType> implements RxStorageInstance<RxDocType, BrowserStorageInternals, BrowserStorageSettings> {
    readonly databaseName: string;
    readonly collectionName: string;
    readonly schema: Readonly<RxJsonSchema<RxDocType>>;
    readonly internals: BrowserStorageInternals;
    private changes$;
    readonly instanceId: number;
    private closed;
    constructor(databaseName: string, collectionName: string, schema: Readonly<RxJsonSchema<RxDocType>>, internals: BrowserStorageInternals);
    prepareQuery(mutateableQuery: MangoQuery<RxDocType>): MangoQuery<RxDocType>;
    getSortComparator(query: MangoQuery<RxDocType>): DeterministicSortComparator<RxDocType>;
    getQueryMatcher(query: MangoQuery<RxDocType>): QueryMatcher<RxDocumentWriteData<RxDocType>>;
}
export declare const createBrowserStorageLocalState: <RxDocType>(params: RxStorageInstanceCreationParams<RxDocType, BrowserStorageSettings>) => Promise<{
    databaseState: import("./types/browser-storeage-state").BrowserStorageState;
    primaryPath: string;
}>;
export declare const createBrowserStorageInstance: <RxDocType>(params: RxStorageInstanceCreationParams<RxDocType, BrowserStorageSettings>) => Promise<RxStorageBrowserInstance<RxDocType>>;
