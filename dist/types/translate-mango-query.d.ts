import { MangoQuery } from "rxdb";
import { Index } from "./types/browser-storeage-state";
import { ITranslatedQuery } from "./types/translate-mango-query";
export declare const translateMangoQuerySelector: <RxDocType>(query: MangoQuery<RxDocType>, indexes: Index[]) => ITranslatedQuery;
