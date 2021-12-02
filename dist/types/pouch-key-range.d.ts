import { MangoQuery } from "rxdb";
import { Index } from "./types/browser-storeage-state";
import { IPouchKeyRangeData } from "./types/pouch-key-range";
export declare const generatePouchKeyRange: <RxDocType>(query: MangoQuery<RxDocType>, indexes: Index[]) => IPouchKeyRangeData;
