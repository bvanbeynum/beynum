import HtmlWebpackPlugin from "html-webpack-plugin";

export default {
	entry: {
		commandcenter: "./client/src/commandcenter.jsx",
		finance: "./client/src/finance.jsx",
		blackjack: "./client/src/blackjack.jsx"
	},
	plugins: [
		new HtmlWebpackPlugin({ 
			filename: "commandcenter.html",
			template: "./client/src/commandcenter.html"
		}),
		new HtmlWebpackPlugin({ 
			filename: "finance.html",
			title: "Fianace",
			favicon: "./client/src/media/favicon.ico",
			meta: {
				viewport: "width=device-width, initial-scale=1"
			},
			chunks: [ "finance" ],
			templateContent: "<html><body><div id='root'></div></body></html>"
		}),
		new HtmlWebpackPlugin({ 
			filename: "blackjack.html",
			title: "Black Jack",
			favicon: "./client/src/media/favicon.ico",
			meta: {
				viewport: "width=device-width, initial-scale=1"
			},
			chunks: [ "blackjack" ],
			templateContent: "<html><body><div id='root'></div></body></html>"
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
				test: /\.(png|gif|jpg|ico)$/i,
				type: "asset/resource"
			}
		]
	},
	resolve: { extensions: [ "*", ".js", ".jsx" ]}
};
