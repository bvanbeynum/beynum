// Setup =======================================================================

import { fileURLToPath } from "url";
import { dirname } from "path";
import config from "./server/config.js";
import express from "express";
import bodyParser from "body-parser";
import officeRouter from "./server/officerouter.js"

const app = express();
const { json, urlencoded } = bodyParser;
const port = config.port || 9201;
const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFile);

// Config =======================================================================

app.set("x-powered-by", false);
app.set("root", currentDirectory);
app.use(json());
app.use(urlencoded({ extended: true }));

// Routes =======================================================================

app.use(officeRouter);

// listen (start app with node server.js) ======================================

app.listen(port);
console.log("App listening on port " + port);
