import { OpenAPIV3 } from "../types";

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
