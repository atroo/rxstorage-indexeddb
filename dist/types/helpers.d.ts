import { RxJsonSchema } from "rxdb";
import { PrimaryKey, RxErrorKey, RxErrorParameters } from "rxdb/dist/types/types";
import { BrowserStorageState } from "./types/browser-storeage-state";
import { RxError } from "./rx-error";
export declare const CHANGES_COLLECTION_SUFFIX = "-rxdb-changes";
/**
 * TODO: migrations
 * 1) Before updating store we need to copy all data to somewhere else.
 * 2) Created new store.
 * 3) Put old data to new store.
 *
 * TODO: "close" notifications ?
 */
export declare const getIdbDatabase: <RxDocType>(databaseName: string, collectionName: string, primaryPath: string, schema: RxJsonSchema<RxDocType>) => Promise<BrowserStorageState>;
export declare function getPrimaryFieldOfPrimaryKey<RxDocType>(primaryKey: PrimaryKey<RxDocType>): keyof RxDocType;
export declare function newRxError(code: RxErrorKey, parameters?: RxErrorParameters): RxError;
