import { OpenAPIV3 } from "../types";
import { generateArrayValidator } from "./array";
import { generateNumberValidator } from "./number";
import { generateObjectValidator } from "./object";
import { generateStringValidator } from "./string";
import { generateTypeValidator } from "./type";

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
        return [];
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
