import { MangoQuery } from "rxdb";
export declare const translateMangoQuerySelector: <RxDocType>(query: MangoQuery<RxDocType>) => {
    queryOpts: any;
    inMemoryFields: string[];
};
