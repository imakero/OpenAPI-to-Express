import yaml from "js-yaml";
import * as fs from "fs/promises";
import { PathLike } from "fs";

export async function parseYaml(path: PathLike) {
  try {
    const file = await fs.readFile(path, "utf8");
    return yaml.load(file.toString());
  } catch (e) {
    console.log(e);
  }
}
