import { MangoQuery } from "rxdb";
import { ITranslatedQuery } from "./types/translate-mango-query";
export declare const translateMangoQuerySelector: <RxDocType>(query: MangoQuery<RxDocType>) => ITranslatedQuery;
