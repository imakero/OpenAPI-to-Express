import { Application } from "express";
import { getAllOperations } from "./lib/helpers";
import { OpenAPIV3 } from "./types";
import { generatePathParameterValidator } from "./validators/pathParameter";
import { generateRequestBodyValidator } from "./validators/requestBody";

export const addValidation = (app: Application, doc: OpenAPIV3.Document) => {
  const operations = getAllOperations(doc);
  operations.forEach((operation) => {
    const operationObject = operation.pathItem[operation.operation];
    const requestBodyValidator = generateRequestBodyValidator(operationObject);

    app[operation.operation](operation.url, (req, res, next) => {
      const errors = requestBodyValidator(req);

      if (errors.length) {
        return res.status(400).json({ errors, status: 400 });
      }
      console.log(
        "validation middleware for",
        operation.operation,
        operation.url
      );
      next();
    });
  });
};
