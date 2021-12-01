import { IDBPDatabase } from "idb";
import { IMetaDB } from "./types/browser-storeage-state";
export declare const getDbMeta: () => Promise<IDBPDatabase<IMetaDB>>;
