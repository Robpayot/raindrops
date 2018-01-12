const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

module.exports = {
	entry: './app/js/app.js',
	devtool: 'inline-source-map',
	devServer: {
		contentBase: './dist',
		watchContentBase: false,
		hot: true
	},
	plugins: [
		new CleanWebpackPlugin(['dist']),
		new HtmlWebpackPlugin({
			title: 'Shaking drops',
			template: 'app/index.hbs'
		}),
		new CopyWebpackPlugin([
			// { from: 'app/index.hbs' },
			{ from: 'app/templates', to: 'templates' },
			{ from: 'app/images', to: 'images' }
		]),
		new webpack.NamedModulesPlugin(),
		new webpack.HotModuleReplacementPlugin()
	],
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
		hotUpdateChunkFilename: 'hot/hot-update.js',
		hotUpdateMainFilename: 'hot/hot-update.json'
	},
	module: {
		rules: [{
			test: /\.scss$/,
			use: [{
				loader: 'style-loader' // creates style nodes from JS strings
			}, {
				loader: 'css-loader' // translates CSS into CommonJS
			}, {
				loader: 'sass-loader' // compiles Sass to CSS
			}]
		}, {
			enforce: 'pre',
			test: /\.js$/,
			exclude: [/(node_modules|bower_components)/, path.resolve(__dirname, 'vendors')],
			loader: 'eslint-loader'
		}, {
			test: /\.js$/,
			exclude: [/(node_modules|bower_components)/, path.resolve(__dirname, 'vendors')],
			use: {
				loader: 'babel-loader',
				options: {
					presets: ['@babel/preset-env']
				}
			}
		}, {
			test: /\.(png|svg|jpg|gif)$/,
			use: [
				'file-loader'
			]
		}, {
			test: /\.(woff|woff2|eot|ttf|otf)$/,
			use: [
				'file-loader'
			]
		}, {
			test: /\.(html)$/,
			use: {
				loader: 'html-loader'
			}
		}, {
			test: /\.hbs$/,
			loader: 'handlebars-loader'
		}]
	}
}
