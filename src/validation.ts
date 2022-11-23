import { Application, Request } from "express";
import {
  httpVerbs,
  pathPatternToExpress,
  shallowMapObject,
  validateDateTime,
} from "./lib/helpers";
import { OpenAPIV3 } from "./types";

export const dereferenceDocument = (doc: OpenAPIV3.Document): any => {
  return dereferenceValue(doc, doc);
};

export const dereferenceValue = (doc: OpenAPIV3.Document, value: any): any => {
  if (
    !value ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "undefined"
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

    return schemaValidator(req.body);
  };
};

export const generateSchemaValidator = (
  schema: OpenAPIV3.SchemaObject,
  propertyName: string
) => {
  return (value: any): string[] => {
    const typeValidatorResult = generateTypeValidator(
      schema,
      propertyName
    )(value);

    if (typeValidatorResult.length) {
      return typeValidatorResult;
    }

    switch (schema.type) {
      case "null":
      case "boolean":
      case "string":
        const stringValidator = generateStringValidator(schema, propertyName);
        return stringValidator(value);
      case "number":
      case "integer":
        const numberValidator = generateNumberValidator(schema, propertyName);
        return numberValidator(value);
      case "object":
        const objectValidator = generateObjectValidator(schema, propertyName);
        return objectValidator(value);
      case "array":
        const arrayValidator = generateArrayValidator(schema, propertyName);
        return arrayValidator(value);
      default:
        throw new Error("Unsupported type");
    }
  };
};

export const generateStringValidator =
  (schema: OpenAPIV3.SchemaObject, propertyName: string) => (value: string) => {
    const stringValidators = [generateDateTimeValidator(schema, propertyName)];

    return stringValidators.flatMap((validator) => validator(value));
  };

export const generateDateTimeValidator =
  (schema: OpenAPIV3.SchemaObject, propertyName: string) => (value: string) => {
    const format = schema["format"];

    if (format === undefined || format !== "date-time") {
      return [];
    }

    return validateDateTime(value)
      ? []
      : [`${propertyName} is not a valid datetime value.`];
  };

export const generateArrayValidator =
  (schema: OpenAPIV3.ArraySchemaObject, propertyName: string) =>
  (value: any[]) => {
    const arrayValidators = [generateItemsValidator(schema, propertyName)];

    return arrayValidators.flatMap((validator) => validator(value));
  };

export const generateItemsValidator =
  (schema: OpenAPIV3.ArraySchemaObject, propertyName: string) =>
  (value: any[]) => {
    const itemsSchema = schema["items"];

    if (itemsSchema === undefined) {
      return [];
    }

    return value.flatMap((item, index) => {
      const schemaValidator = generateSchemaValidator(
        itemsSchema as OpenAPIV3.SchemaObject,
        `${propertyName}[${index}]`
      );
      return schemaValidator(item);
    });
  };

export const generateObjectValidator =
  (schema: OpenAPIV3.SchemaObject, propertyName: string) =>
  (value: { [property: string]: any }) => {
    const objectValidators = [
      generateRequiredValidator(schema, propertyName),
      generatePropertiesValidator(schema, propertyName),
    ];

    return objectValidators.flatMap((validator) => validator(value));
  };

export const generatePropertiesValidator =
  (schema: OpenAPIV3.SchemaObject, propertyName: string) => (value: any) => {
    const properties = schema["properties"];

    if (properties === undefined) {
      return [];
    }

    return Object.entries(properties).flatMap(
      ([subPropertyName, subSchema]) => {
        if (!value[subPropertyName]) {
          return [];
        }

        const schemaValidator = generateSchemaValidator(
          subSchema as OpenAPIV3.SchemaObject,
          `${propertyName}.${subPropertyName}`
        );

        return schemaValidator(value[subPropertyName]);
      }
    );
  };

export const generateRequiredValidator =
  (schema: OpenAPIV3.SchemaObject, propertyName: string) =>
  (value: { [property: string]: any }) => {
    const required = schema["required"];

    if (!required) {
      return [];
    }

    return required.flatMap((requiredProperty) =>
      value[requiredProperty] === undefined
        ? [`${propertyName}.${requiredProperty} is required.`]
        : []
    );
  };

export const generateNumberValidator =
  (schema: OpenAPIV3.SchemaObject, propertyName: string) => (value: number) => {
    const numericValidators = [
      generateMultipleOfValidator(schema, propertyName),
    ];

    return numericValidators.flatMap((validator) => validator(value));
  };

export const generateMultipleOfValidator =
  (schema: OpenAPIV3.SchemaObject, propertyName: string) => (value: number) => {
    const multiple = schema["multipleOf"];

    if (multiple === undefined) {
      return [];
    }

    return value % multiple === 0
      ? []
      : [`${propertyName} must be a multiple of ${multiple}.`];
  };

export const generateTypeValidator = (
  schema: OpenAPIV3.SchemaObject,
  propertyName: string
) => {
  const type = schema["type"];
  const typesArray = Array.isArray(type) ? type : [type];

  return (value: any) => {
    return typesArray.some((type) => {
      switch (type) {
        case "null":
          return value === null;
        case "string":
        case "boolean":
        case "number":
          return typeof value === type;
        case "integer":
          return parseInt(value) === value;
        case "array":
          return Array.isArray(value);
        case "object":
          return value && !Array.isArray(value) && typeof value === "object";
        default:
          throw new Error("Invalid value for type");
      }
    })
      ? []
      : [
          `Incorrect type for ${propertyName}, expected ${
            Array.isArray(type) ? `one of ${type}.` : `'${type}'`
          }`,
        ];
  };
};

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
