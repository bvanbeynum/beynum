// Imports =======================================================================

import { fileURLToPath } from "url";
import path, { dirname } from "path";
import config from "./server/config.js";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import officeRouter from "./server/officerouter.js";
import financeRouter from "./server/financerouter.js";
import blackJackRouter from "./server/blackjackrouter.js";

// Declarations =======================================================================

const app = express();
const { json, urlencoded } = bodyParser;
const port = config.port || 9201;
const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFile);

// Config =======================================================================

app.set("x-powered-by", false);
app.set("root", currentDirectory);
app.use(json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));

// Routes =======================================================================

app.use(officeRouter);
app.use(financeRouter);
app.use(blackJackRouter);

app.use("/media", express.static(path.join(currentDirectory, "/client/src/media")));

if (config.mode === "development") {
	Promise.all([
		import("webpack"),
		import("webpack-dev-middleware"),
		import("./webpack.dev.js")
	])
	.then(([webpack, webpackDevMiddleware, webpackConfig]) => {
		const webpackLoader = webpack.default;
		const middleware = webpackDevMiddleware.default;

		const compilier = webpackLoader(webpackConfig.default);
		app.use(middleware(compilier, { publicPath: "/" }));
	});
}
else {
	app.use(express.static(path.join(currentDirectory, "/client/static")));
}

// listen (start app with node server.js) ======================================

app.listen(port, () => {
	console.log("App listening on port " + port);
});
