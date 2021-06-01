// Imports =======================================================================

import { fileURLToPath } from "url";
import path, { dirname } from "path";
import config from "./server/config.js";
import express from "express";
import bodyParser from "body-parser";
import officeRouter from "./server/officerouter.js"
import webpack from "webpack";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpackConfig from "./webpack.dev.js";

// Declarations =======================================================================

const app = express();
const { json, urlencoded } = bodyParser;
const port = config.port || 9201;
const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFile);
const compilier = webpack(webpackConfig);

// Config =======================================================================

app.set("x-powered-by", false);
app.set("root", currentDirectory);
app.use(json());
app.use(urlencoded({ extended: true }));

// Routes =======================================================================

app.use(officeRouter);

if (webpackConfig.mode === "development") {
	app.use(webpackDevMiddleware(compilier, { publicPath: webpackConfig.output.publicPath }))
}
else {
	app.use(express.static(path.join(currentDirectory, "/client/static")));
}

// listen (start app with node server.js) ======================================

app.listen(port, () => {
	console.log("App listening on port " + port);
});
