export const getEventKey = (
  isLocal: boolean,
  primary: string,
  revision: string
) => {
  const prefix = isLocal ? "local" : "non-local";
  const eventKey = prefix + "|" + primary + "|" + revision;
  return eventKey;
};

/**
 * let's assume for now that indexes like "hey[].ho" are invalid
 * @param {string} index
 * @returns {boolean}
 */
export const isIndexValid = (index: string) => {
  return index.split(".").length === 1;
};

/**
 *
 * @param {string | string[]} index
 * @returns {boolean}
 */
export const validateIndexValues = (index: string | string[]) => {
  if (typeof index === "string") {
    return isIndexValid(index);
  }

  return index.every((part) => isIndexValid(part));
};
