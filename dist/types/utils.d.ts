export declare const getEventKey: (isLocal: boolean, primary: string, revision: string) => string;
/**
 * let's assume for now that indexes like "hey[].ho" are invalid
 * @param {string} index
 * @returns {boolean}
 */
export declare const isIndexValid: (index: string) => boolean;
/**
 *
 * @param {string | string[]} index
 * @returns {boolean}
 */
export declare const validateIndexValues: (index: string | readonly string[] | string[]) => boolean;
