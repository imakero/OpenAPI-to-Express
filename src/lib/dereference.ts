import { OpenAPIV3 } from "../types";
import { shallowMapObject } from "./helpers";

export const dereferenceDocument = (doc: OpenAPIV3.Document): any => {
  return dereferenceValue(doc, doc);
};

export const dereferenceValue = (doc: OpenAPIV3.Document, value: any): any => {
  if (
    !value ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  } else if (Array.isArray(value)) {
    return value.map((entry) => dereferenceValue(doc, entry));
  } else if (typeof value === "object") {
    if (value["$ref"]) {
      return dereferenceValue(doc, getReferencedDocument(doc, value["$ref"]));
    } else {
      return shallowMapObject(value, ([key, value]: [string, any]) => ({
        [key]: dereferenceValue(doc, value),
      }));
    }
  }
};

export const getReferencedDocument = (doc: OpenAPIV3.Document, ref: string) => {
  if (ref[0] === "#") {
    const pathArray = getLocalReferencePathArray(ref);
    return getValueAtPath(doc, pathArray);
  } else {
    throw new Error("this case is not handled yet");
  }
};

export const getValueAtPath = (doc: OpenAPIV3.Document, pathArray: string[]) =>
  pathArray.reduce((current: any, key) => current[key], doc);

export const getLocalReferencePathArray = (ref: string) =>
  ref.split("/").slice(1);
