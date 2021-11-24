import { RxErrorKey, RxErrorParameters } from "rxdb/dist/types/types";

function parametersToString(parameters: any): string {
  let ret = "";
  if (Object.keys(parameters).length === 0) return ret;
  ret += "Given parameters: {\n";
  ret += Object.keys(parameters)
    .map((k) => {
      let paramStr = "[object Object]";
      try {
        paramStr = JSON.stringify(
          parameters[k],
          (_k, v) => (v === undefined ? null : v),
          2
        );
      } catch (e) {}
      return k + ":" + paramStr;
    })
    .join("\n");
  ret += "}";
  return ret;
}

function messageForError(
  message: string,
  code: string,
  parameters: any
): string {
  return (
    "RxError (" +
    code +
    "):" +
    "\n" +
    message +
    "\n" +
    parametersToString(parameters)
  );
}

export class RxError extends Error {
  public code: RxErrorKey;
  public message: string;
  public parameters: RxErrorParameters;
  public rxdb: true;
  constructor(
    code: RxErrorKey,
    message: string,
    parameters: RxErrorParameters = {}
  ) {
    const mes = messageForError(message, code, parameters);
    super(mes);
    this.code = code;
    this.message = mes;
    this.parameters = parameters;
    this.rxdb = true; // tag them as internal
  }
  get name(): string {
    return "RxError (" + this.code + ")";
  }
  toString(): string {
    return this.message;
  }
  get typeError(): boolean {
    return false;
  }
}
