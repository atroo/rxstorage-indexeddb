import { RxJsonSchema } from "rxdb";
import { PrimaryKey, RxErrorKey, RxErrorParameters } from "rxdb/dist/types/types";
import { BrowserStorageState } from "./types/browser-storeage-state";
import { RxError } from "./rx-error";
import { IdbSettings } from "./types";
export declare const CHANGES_COLLECTION_NAME = "rxdb-changes";
export declare const IDB_DATABASE_STATE_BY_NAME: Map<string, BrowserStorageState>;
export declare const getChangesCollName: () => string;
export declare const genIndexName: (index: string | string[]) => string;
export declare const getDbName: (dbName: string, collectionName: string) => string;
/**
 * Can be called several times for the same db
 * Save all new collections data in map and run migration once db requessted (getDb)
 *
 * @param databaseName
 * @param collectionName
 * @param primaryPath
 * @param schema
 * @returns
 */
export declare const createIdbDatabase: <RxDocType>(settings: {
    databaseName: string;
    collectionName: string;
    primaryPath: string;
    schema: Pick<RxJsonSchema<RxDocType>, "version" | "indexes">;
    idbSettings: IdbSettings;
}) => Promise<BrowserStorageState>;
export declare function getPrimaryFieldOfPrimaryKey<RxDocType>(primaryKey: PrimaryKey<RxDocType>): string;
export declare function newRxError(code: RxErrorKey, parameters?: RxErrorParameters): RxError;
export declare const getDatabaseState: (databaseName: string) => BrowserStorageState;
