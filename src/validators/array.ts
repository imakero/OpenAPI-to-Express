import { OpenAPIV3 } from "../types";
import { generateSchemaValidator } from "./schema";

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
