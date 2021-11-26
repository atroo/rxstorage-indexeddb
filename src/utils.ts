export const getEventKey = (
  isLocal: boolean,
  primary: string,
  revision: string
) => {
  const prefix = isLocal ? "local" : "non-local";
  const eventKey = prefix + "|" + primary + "|" + revision;
  return eventKey;
};
