import yaml from "js-yaml";
import * as fs from "fs/promises";
import { PathLike } from "fs";
import { OpenAPIV3 } from "../types";

export async function parseYaml(path: PathLike): Promise<OpenAPIV3.Document> {
  try {
    const file = await fs.readFile(path, "utf8");
    return yaml.load(file.toString()) as OpenAPIV3.Document;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
