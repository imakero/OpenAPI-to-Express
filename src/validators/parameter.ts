import { Request } from "express";
import { OpenAPIV3 } from "../types";
import { generateSchemaValidator } from "./schema";

export const generateParameterValidator = (
  operationObject?: OpenAPIV3.OperationObject
) => {
  if (
    !operationObject ||
    !operationObject["parameters"] ||
    !operationObject["parameters"].length
  ) {
    return (req: Request) => [];
  }

  const parameters = operationObject[
    "parameters"
  ] as OpenAPIV3.ParameterObject[];

  return (req: Request) =>
    parameters.flatMap((parameter) => {
      const location = parameter["in"];
      const parameterName = parameter["name"];
      const schema = parameter["schema"];

      if (!schema) {
        return [];
      }

      if (location === "path") {
        if (!req.params[parameterName]) {
          return [`params.${parameterName} is required`];
        }
        const schemaValidator = generateSchemaValidator(
          schema as OpenAPIV3.SchemaObject,
          `params.${parameterName}`
        );
        return schemaValidator(req.params[parameterName]);
      }
    });
};
