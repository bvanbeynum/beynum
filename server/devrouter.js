
import webpack from "webpack";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpackConfig from "../webpack.dev.js";

const compilier = webpack(webpackConfig);
const middleware = webpackDevMiddleware(compilier, { publicPath: "/" })

export default middleware;
