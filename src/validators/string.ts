import { isDateTime } from "../lib/helpers";
import { OpenAPIV3 } from "../types";

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

    return isDateTime(value)
      ? []
      : [`${propertyName} is not a valid datetime value.`];
  };
