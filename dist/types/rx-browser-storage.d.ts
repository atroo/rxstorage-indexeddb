/// <reference types="pouchdb-core" />
/// <reference types="node" />
import { DeterministicSortComparator, QueryMatcher } from "event-reduce-js";
import { MangoQuery, RxJsonSchema, RxStorage } from "rxdb";
import { RxDocumentWriteData, RxKeyObjectStorageInstanceCreationParams, RxStorageInstanceCreationParams } from "rxdb/dist/types/types/rx-storage";
import { BrowserStorageInternals, BrowserStorageSettings, IdbSettings } from "./types/browser-storage";
export declare class RxBrowserStorage implements RxStorage<BrowserStorageInternals, IdbSettings> {
    databaseSettings: IdbSettings;
    name: string;
    statics: Readonly<{
        hash(data: string | Buffer | Blob): Promise<string>;
        hashKey: string;
        prepareQuery<DocumentData>(schema: RxJsonSchema<DocumentData>, mutateableQuery: MangoQuery<DocumentData>): any;
        getSortComparator<DocumentData_1>(schema: RxJsonSchema<DocumentData_1>, query: MangoQuery<DocumentData_1>): DeterministicSortComparator<DocumentData_1>;
        getQueryMatcher<DocumentData_2>(schema: RxJsonSchema<DocumentData_2>, query: MangoQuery<DocumentData_2>): QueryMatcher<RxDocumentWriteData<DocumentData_2>>;
    }>;
    constructor(databaseSettings: IdbSettings);
    createStorageInstance<RxDocType>(params: RxStorageInstanceCreationParams<RxDocType, BrowserStorageSettings>): Promise<import("./rx-browser-storage-instance").RxStorageBrowserInstance<RxDocType>>;
    createKeyObjectStorageInstance(params: RxKeyObjectStorageInstanceCreationParams<BrowserStorageSettings>): Promise<import("./rx-browser-key-object-storage-instance").RxBrowserKeyObjectStorageInstance<unknown>>;
}
export declare function getRxIdbStorage(databaseSettings?: IdbSettings): RxBrowserStorage;
