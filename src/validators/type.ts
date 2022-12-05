import { OpenAPIV3 } from "../types";

type Options = {
  parseNumber: boolean;
};

export const generateTypeValidator = (
  schema: OpenAPIV3.SchemaObject,
  propertyName: string,
  options: Options = { parseNumber: false }
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
          if (options.parseNumber && typeof value === "string") {
            return (
              !Number.isNaN(parseInt(value)) &&
              parseInt(value) === parseFloat(value)
            );
          }
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
