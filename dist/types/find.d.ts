import { IDBPDatabase } from "idb";
import { MangoQuery } from "rxdb/dist/types/types";
export declare const find: <RxDocType>(db: IDBPDatabase<unknown>, collectionName: string, query: MangoQuery<RxDocType>) => Promise<any[]>;
