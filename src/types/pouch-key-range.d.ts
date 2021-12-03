export type StartKey = number | null | undefined;
export type EndKey = number | Record<string, {}> | undefined;

interface IQueryOpts {
  startkey: Array<StartKey | EndKey>;
  endkey: Array<EndKey | StartKey>;
  inclusiveStart?: boolean;
  inclusiveEnd?: boolean;
}

/**
 * @param {string[]} inMemoryFields fields with non logical operators that should be filtered manually
 */
export interface IPouchKeyRangeData {
  field: string | null; // TODO: compound fields
  inMemoryFields: string[];
  queryOpts?: IQueryOpts | null;
  primary?: boolean;
}

export interface IIdbKeyRangeOptions extends IQueryOpts {
  descending?: boolean;
  key?: string;
}
