import { parseYaml } from "./lib/parseYaml";
import { HttpVerb, OpenAPIV3 } from "./types";
import express, { Application, json, Request, Response } from "express";
import cors from "cors";
import { pathPatternToExpress } from "./lib/helpers";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";
dotenv.config();

async function start() {
  const filename = process.argv[2];
  const doc = (await parseYaml(filename)) as OpenAPIV3.Document;
  const app = createServer();
  addDocumentation(app, doc);
  generatePaths(app, doc);
  app.listen(process.env.PORT, () =>
    console.log(`App listening on port ${process.env.PORT}`)
  );
}

async function addDocumentation(app: Application, doc: OpenAPIV3.Document) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(doc));
}

function createServer(): Application {
  const app: Application = express();
  app.use(cors());
  app.use(json());
  return app;
}

async function generatePaths(app: Application, doc: OpenAPIV3.Document) {
  const paths = doc.paths;
  Object.entries(paths).forEach(([pattern, path]) => {
    console.log(`Handling path: ${pathPatternToExpress(pattern)}`);
    handlePattern(app, pattern, path);
  });
}

function handlePattern(
  app: Application,
  pattern: string,
  path: OpenAPIV3.PathItemObject
) {
  Object.entries(path).forEach(([fieldName, value]) => {
    switch (fieldName) {
      case "$ref":
      case "tags":
      case "summary":
      case "description":
      case "externalDocs":
      case "servers":
      case "parameters":
        return console.log("Not handled");
      case "get":
      case "put":
      case "post":
      case "delete":
      case "options":
      case "head":
      case "patch":
      case "trace":
        console.log(`- Adding operation: '${fieldName}'`);
        generatePath(app, pattern, fieldName, value);
        return;
      default:
        throw new Error("Unsupported fieldName");
    }
  });
}

function generatePath(
  app: Application,
  pattern: string,
  verb: HttpVerb,
  operation: OpenAPIV3.OperationObject
) {
  app[verb](pattern, (req: Request, res: Response) => {
    console.log("adding ");
    res.sendStatus(200);
  });
}

start();
