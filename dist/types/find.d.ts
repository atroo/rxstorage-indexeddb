import { IDBPDatabase } from "idb";
import { MangoQuery } from "rxdb/dist/types/types";
export declare const find: <RxDocType>(db: IDBPDatabase<unknown>, databaseName: string, collectionName: string, query: MangoQuery<RxDocType>) => Promise<any[]>;
