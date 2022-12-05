import { HttpVerb, OpenAPIV3 } from "../types";

export const getServerObjects = (doc: OpenAPIV3.Document) =>
  !doc.servers || !doc.servers.length ? [{ url: "/" }] : doc.servers;

export const getPathOperations = (path: OpenAPIV3.PathItemObject) =>
  httpVerbs.filter((verb) => path[verb]);

export const getAllPathsOperations = (doc: OpenAPIV3.Document) =>
  Object.entries(doc.paths).map(([url, pathItem]) => ({
    url,
    pathItem: pathItem,
    operations: getPathOperations(pathItem),
  }));

export const getAllOperations = (doc: OpenAPIV3.Document) =>
  getServerObjects(doc).flatMap((server) =>
    getAllPathsOperations(doc).flatMap(({ url, pathItem, operations }) =>
      operations.map((operation) => ({
        url: pathPatternToExpress(`${server.url}${url}`),
        pathItem,
        operation,
      }))
    )
  );

export const pathPatternToExpress = (pattern: string) =>
  pattern.replace(/\{(.+?)\}/g, ":$1");

export const expressPathToFilePath = (pattern: string) =>
  pattern.replace(/:([^/]*)/g, "[$1]");

export const httpVerbs: HttpVerb[] = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
];

export const shallowMapObject = (
  object: object,
  mapping: ([key, value]: [string, any]) => void
) => Object.assign({}, ...Object.entries(object).map(mapping));

export const isDateTime = (dateTime: string) => {
  // https://stackoverflow.com/a/28022901
  const re =
    /^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:Z|[+-][01]\d:[0-5]\d)$/;
  return re.test(dateTime);
};
