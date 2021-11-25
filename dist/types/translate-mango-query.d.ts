import { MangoQuery } from "rxdb";
export declare const translateMangoQuery: <RxDocType>(query: MangoQuery<RxDocType>) => {
    queryOpts: any;
    inMemoryFields: string[];
};
