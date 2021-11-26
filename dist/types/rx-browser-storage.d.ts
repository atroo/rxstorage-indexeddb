/// <reference types="pouchdb-core" />
/// <reference types="node" />
import { RxStorage } from "rxdb";
import { RxKeyObjectStorageInstanceCreationParams, RxStorageInstanceCreationParams } from "rxdb/dist/types/types/rx-storage";
import { BrowserStorageInternals, BrowserStorageSettings } from "./types/browser-storage";
export declare class RxBrowserStorage implements RxStorage<BrowserStorageInternals, BrowserStorageSettings> {
    name: string;
    hash(data: Buffer | Blob | string): Promise<string>;
    createStorageInstance<RxDocType>(params: RxStorageInstanceCreationParams<RxDocType, BrowserStorageSettings>): Promise<import("./rx-browser-storage-instance").RxStorageBrowserInstance<RxDocType>>;
    createKeyObjectStorageInstance(params: RxKeyObjectStorageInstanceCreationParams<BrowserStorageSettings>): Promise<import("./rx-browser-key-object-storage-instance").RxStorageKeyObjectInstanceLoki<unknown>>;
}
export declare function getRxSBrowserIdbStorage(databaseSettings?: BrowserStorageSettings): RxBrowserStorage;
