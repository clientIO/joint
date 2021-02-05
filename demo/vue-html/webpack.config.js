/* eslint-env node */

const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

let config = {
	entry: './src/main.js',
	output: {},
	resolve: {
		extensions: ['.js', '.vue', '.json'],
		alias: {
			'@': path.resolve(__dirname, 'src')
		}
	},
	module: {
		rules: [{
			enforce: 'pre',
			test: /\.(js|vue)$/,
			loader: 'eslint-loader',
			options: {
				configFile: './.eslintrc.json'
			}
		}, {
			test: /\.vue$/,
			loader: 'vue-loader'
		}, {
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel-loader'
		}, {
			test: /\.css$/,
			use: [
				'css-loader'
			]
		}, {
			test: /\.(png|jpg|gif|svg)$/,
			loader: 'file-loader',
			options: {
				name: 'img/[name].[hash:8].[ext]'
			}
		}]
	},
	plugins: [
		new VueLoaderPlugin(),
		new HtmlWebpackPlugin({
			template: 'index.html',
			title: process.env.npm_package_description
		}),
		new CleanWebpackPlugin()
	],
	optimization: {
		splitChunks: {
			chunks: 'all'
		}
	}
};

module.exports = (env, argv) => {
	const styleRules = config.module.rules.filter(obj => Array.isArray(obj.use) && obj.use[0] === 'css-loader');
	if (argv.mode === 'production') {
		config.output.filename = '[name].[chunkhash:8].js';
		config.plugins.push(new MiniCssExtractPlugin({
			filename: '[name].[contenthash:8].css'
		}));
		styleRules.forEach(rule => {
			rule.use.unshift(MiniCssExtractPlugin.loader);
		});
		config.stats = {
			children: false,
			modules: false
		};
		config.optimization.minimizer = [
			new TerserPlugin({
				cache: true,
				parallel: true,
				terserOptions: {
					compress: {
						pure_funcs: ['console.log']
					},
					output: {
						comments: false
					}
				}
			}),
			new OptimizeCSSAssetsPlugin({
				cssProcessorPluginOptions: {
					preset: ['default', {
						discardComments: {
							removeAll: true
						}
					}]
				}
			})
		];
		config.performance = {
			maxAssetSize: 768000,
			maxEntrypointSize: 1024000
		};
	} else {
		config.output.filename = '[name].js';
		styleRules.forEach(rule => {
			rule.use.unshift('vue-style-loader');
		});
		config.devServer = {
			stats: {
				children: false,
				modules: false
			}
		};
		config.devtool = 'cheap-module-eval-source-map';
	}
	return config;
};
