import { OpenAPIV3 } from "../types";
import { generateSchemaValidator } from "./schema";

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
