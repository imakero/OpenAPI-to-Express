import { HttpVerb } from "../types";

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
