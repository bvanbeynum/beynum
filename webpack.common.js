import HtmlWebpackPlugin from "html-webpack-plugin";

export default {
	entry: {
		commandcenter: "./client/src/commandcenter.jsx",
		blackjack: "./client/src/blackjack.jsx",
		sys: "./client/src/sys.jsx",
		workout: "./client/src/workout.jsx",
		network: "./client/src/network.jsx"
	},
	plugins: [
		new HtmlWebpackPlugin({ 
			filename: "commandcenter.html",
			template: "./client/src/commandcenter.html"
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
			filename: "working.html",
			title: "Working",
			favicon: "./client/src/media/favicon.ico",
			chunks: [ ],
			template: "./client/src/working.html"
		}),
		new HtmlWebpackPlugin({ 
			filename: "sys.html",
			title: "System Controls",
			favicon: "./client/src/media/favicon.ico",
			meta: {
				viewport: "width=device-width, initial-scale=1"
			},
			chunks: [ "sys" ],
			templateContent: "<html><body><div id='root'></div></body></html>"
		}),
		new HtmlWebpackPlugin({ 
			filename: "workout.html",
			title: "Workout",
			favicon: "./client/src/media/favicon.ico",
			meta: {
				viewport: "width=device-width, initial-scale=1"
			},
			chunks: [ "workout" ],
			templateContent: "<html><body><div id='root'></div></body></html>"
		}),
		new HtmlWebpackPlugin({ 
			filename: "network.html",
			title: "Network",
			favicon: "./client/src/media/favicon.ico",
			meta: {
				viewport: "width=device-width, initial-scale=1"
			},
			chunks: [ "network" ],
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
				test: /\.(png|gif|jpg|ico|mp3)$/i,
				type: "asset/resource"
			},
			// {
			// 	test: /\.mp3$/i,
			// 	loader: "file-loader",
			// 	// options: { name: "[path][name].[ext]" }
			// }

		]
	},
	resolve: { extensions: [ "*", ".js", ".jsx" ]}
};
