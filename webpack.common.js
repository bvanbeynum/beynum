import HtmlWebpackPlugin from "html-webpack-plugin";

export default {
	entry: {
		commandcenter: "./client/src/commandcenter.js"
	},
	plugins: [
		new HtmlWebpackPlugin({ 
			filename: "commandcenter.html",
			template: "./client/src/commandcenter.html"
		})
	],
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/i,
				exclude: /(node_modules|bower_components)/i,
				loader: "babel-loader",
				options: { presets: [ "@babel/env" ]}
			},
			{
				test: /\.css$/i,
				use: [ "style-loader", "css-loader" ]
			},
			{
				test: /\.(png|gif|jpg)$/i,
				type: "asset/resource"
			}
		]
	},
	resolve: { extensions: [ "*", ".js", ".jsx" ]}
};
