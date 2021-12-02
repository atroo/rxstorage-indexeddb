export type StartKey = number | null | undefined;
export type EndKey = number | Record<string, {}> | undefined;

export interface IPouchKeyRangeData {
  field: string | null; // TODO: compound fields
  inMemoryFields: string[]; // TODO: fields with non logical operators that should filtered manually
  queryOpts?: {
    startkey?: StartKey | EndKey;
    endkey: EndKey | StartKey;
    inclusive_start?: boolean;
    inclusive_end?: boolean;
  } | null;
}

export interface IIdbKeyRangeOptions {
  startkey?: StartKey | EndKey;
  endkey: EndKey | StartKey;
  inclusive_start?: boolean;
  inclusive_end?: boolean;
  descending?: boolean;
  key?: string;
}
