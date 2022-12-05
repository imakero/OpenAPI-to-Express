import { Request } from "express";
import { OpenAPIV3 } from "../types";
import { generateSchemaValidator } from "./schema";

export const generateRequestBodyValidator = (
  operationObject?: OpenAPIV3.OperationObject
) => {
  if (!operationObject || !operationObject["requestBody"]) {
    return (req: Request) => [];
  }

  const content = (
    operationObject["requestBody"] as OpenAPIV3.RequestBodyObject
  )["content"];

  const acceptedContentTypes = Object.keys(content);

  return (req: Request) => {
    const contentTypeHeader = req.headers["content-type"];

    if (!contentTypeHeader) {
      return [`Please set 'Content-Type' header.`];
    } else if (
      contentTypeHeader &&
      !acceptedContentTypes.includes(contentTypeHeader)
    ) {
      return [
        `Content type '${contentTypeHeader}' not supported. Supported content types are ${acceptedContentTypes}`,
      ];
    }

    const bodySchema = content[contentTypeHeader][
      "schema"
    ] as OpenAPIV3.SchemaObject;

    const schemaValidator = generateSchemaValidator(bodySchema, "body");

    // console.log(
    //   "VALIDATOR",
    //   generateSchemaValidator(bodySchema, "body").toString()
    // );

    return schemaValidator(req.body);
  };
};
