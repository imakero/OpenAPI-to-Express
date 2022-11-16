import { parseYaml } from "./lib/parseYaml";
import { HttpVerb, OpenAPIV3, ValidationError } from "./types";
import express, {
  Application,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import cors from "cors";
import { pathPatternToExpress } from "./lib/helpers";
import swaggerUi from "swagger-ui-express";
import * as OpenApiValidator from "express-openapi-validator";
import http from "http";
import dotenv from "dotenv";
dotenv.config();

async function start() {
  const filename = process.argv[2];
  const doc = (await parseYaml(filename)) as OpenAPIV3.Document;
  const app = createServer();
  addDocumentation(app, doc);
  addValidation(app, doc);
  generatePaths(app, doc);

  app.use(
    (
      error: ValidationError,
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      if (!error.status) {
        next();
      }

      res.status(error.status || 500).json({
        message: error.message,
        errors: error.errors,
      });
    }
  );
  http
    .createServer(app)
    .listen(process.env.PORT, () =>
      console.log(`App listening on port ${process.env.PORT}`)
    );
}

function addValidation(app: Application, doc: OpenAPIV3.Document) {
  app.use(
    OpenApiValidator.middleware({
      validateSecurity: true,
      apiSpec: "conduit.yml",
      validateRequests: true, // (default)
      validateResponses: false, // false by default
      validateApiSpec: true,
    })
  );
}

function registerHandler(
  app: Application,
  servers: OpenAPIV3.ServerObject[] | undefined,
  verb: HttpVerb | "use",
  path: string,
  ...handlers: RequestHandler[]
) {
  if (!servers || !servers.length) {
    app[verb](path, ...handlers);
  } else {
    servers.forEach((server) => {
      app[verb](`${server.url}${path}`, ...handlers);
    });
  }
}

function addDocumentation(app: Application, doc: OpenAPIV3.Document) {
  registerHandler(
    app,
    doc.servers,
    "use",
    "/docs",
    ...swaggerUi.serve,
    swaggerUi.setup(doc)
  );
}

function createServer(): Application {
  const app: Application = express();
  app.use(cors());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.text());
  app.use(express.json());
  return app;
}

async function generatePaths(app: Application, doc: OpenAPIV3.Document) {
  const paths = doc.paths;
  Object.entries(paths).forEach(([pattern, path]) => {
    console.log(`Handling path: ${pathPatternToExpress(pattern)}`);
    handlePattern(app, doc, pathPatternToExpress(pattern), path);
  });
}

function handlePattern(
  app: Application,
  doc: OpenAPIV3.Document,
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
        generatePath(app, doc, pattern, fieldName, value);
        return;
      default:
        throw new Error("Unsupported fieldName");
    }
  });
}

function generatePath(
  app: Application,
  doc: OpenAPIV3.Document,
  pattern: string,
  verb: HttpVerb,
  operation: OpenAPIV3.OperationObject
) {
  registerHandler(
    app,
    doc.servers || undefined,
    verb,
    pattern,
    (req: Request, res: Response) => {
      res
        .status(200)
        .json({ params: req.params, body: req.body, query: req.query });
    }
  );
}

start();
