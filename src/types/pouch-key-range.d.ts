export type StartKey = number | null | undefined;
export type EndKey = number | Record<string, {}> | undefined;

interface IQueryOpts {
  startkey?: StartKey | EndKey;
  endkey: EndKey | StartKey;
  inclusive_start?: boolean;
  inclusive_end?: boolean;
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
