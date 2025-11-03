import HtmlWebpackPlugin from "html-webpack-plugin";

export default {
	entry: {
		commandcenter: "./client/src/commandcenter.jsx",
		blackjack: "./client/src/blackjack.jsx",
		sys: "./client/src/sys.jsx",
		workout: "./client/src/workout.jsx",
		network: "./client/src/network.jsx",
		vtp: "./client/src/vtp.jsx"
	},
	plugins: [
		new HtmlWebpackPlugin({
			filename: "index.html",
			title: "The Beynum Company",
			favicon: "./client/src/media/favicon.ico",
			template: "./client/src/index.html",
			chunks: []
		}),
		new HtmlWebpackPlugin({
			filename: "privacy.html",
			title: "Privacy Policy - The Beynum Company",
			favicon: "./client/src/media/favicon.ico",
			template: "./client/src/privacy.html",
			chunks: []
		}),
		new HtmlWebpackPlugin({
			filename: "tos.html",
			title: "Terms of Service - The Beynum Company",
			favicon: "./client/src/media/favicon.ico",
			template: "./client/src/tos.html",
			chunks: []
		}),
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
		}),
		new HtmlWebpackPlugin({ 
			filename: "vtp.html",
			title: "VTP",
			favicon: "./client/src/media/favicon.ico",
			meta: {
				viewport: "width=device-width, initial-scale=1"
			},
			chunks: [ "vtp" ],
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
