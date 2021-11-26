export interface ITranslatedQuery {
  fields: string[]; // TODO: compound fields
  inMemoryFields: string[]; // TODO: fields with non logical operators that should filtered manually
  queryOpts: {
    startKey?: Array<number | null>;
    endKey?: Array<number | Record<string, {}>>;
    inclusive_start?: boolean;
    inclusive_end?: boolean;
  };
}
