import HtmlWebpackPlugin from "html-webpack-plugin";

export default {
	entry: {
		commandcenter: "./client/src/commandcenter.jsx",
		finance: "./client/src/finance.jsx",
		blackjack: "./client/src/blackjack.jsx",
		wrestlingevent: "./client/src/wrestlingevent.jsx",
		wrestlingimage: "./client/src/wrestlingimage.jsx"
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
		}),
		new HtmlWebpackPlugin({ 
			filename: "wrestlingevent.html",
			title: "Wrestling Event",
			favicon: "./client/src/media/favicon.ico",
			meta: {
				viewport: "width=device-width, initial-scale=1"
			},
			chunks: [ "wrestlingevent" ],
			templateContent: "<html><body><div id='root'></div></body></html>"
		}),
		new HtmlWebpackPlugin({ 
			filename: "wrestlingimage.html",
			title: "Wrestling Image Categories",
			favicon: "./client/src/media/favicon.ico",
			meta: {
				viewport: "width=device-width, initial-scale=1"
			},
			chunks: [ "wrestlingimage" ],
			templateContent: "<html><body><div id='root'></div></body></html>"
		}),
		new HtmlWebpackPlugin({ 
			filename: "working.html",
			title: "Working",
			favicon: "./client/src/media/favicon.ico",
			chunks: [ ],
			template: "./client/src/working.html"
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
