'use strict';

/* globals cat, cd, cp, echo, exec, exit, find, ls, mkdir, rm, target, test */
var shell = require('shelljs');
var path = require('path');
var webpack = require('sgmf-scripts').webpack;
var ExtractTextPlugin = require('sgmf-scripts')['extract-text-webpack-plugin'];
// var jsFiles = require('sgmf-scripts').createJsPath();
// var scssFiles = require('sgmf-scripts').createScssPath();

function getCartridges() {
    let cwd = process.cwd(), cartridges = {};

    if (shell.find(path.join(cwd, 'webpack_cartridges.json')).stdout !== '') {
        let cartridgeJSON = require(path.join(cwd, 'webpack_cartridges.json'));

        if (cartridgeJSON && cartridgeJSON.cartridge) {
            cartridges = cartridgeJSON.cartridge.map(cartridge => { return path.join(cwd, 'cartridges/', cartridge); });
        }
    }

    if (!cartridges || cartridges.length <= 0) {
        cartridges = shell.ls('-d', path.join(cwd, 'cartridges/*/'));
    }

    cartridges = cartridges.filter(cartridge => { return shell.find(path.join(cartridge, 'cartridge/client/')).stdout !== ''; });
    return cartridges;
}

function getFiles(cartridges, type) {
    let files = {}, isJS = type === 'js';
    type = isJS ? 'js/*.js' : 'scss/**/*.scss';

    cartridges.forEach(cartridge => {
        shell.ls(path.join(cartridge, 'cartridge/client/**/', type)).forEach(file => {

            let name = isJS ? '' : path.basename(file, `.scss`);

            if (name.indexOf('_') !== 0) {
                let location = path.relative(path.join(cartridge, `cartridge/client`), file);
                location = isJS ? location.substr(0, location.length - 3) : location.substr(0, location.length - 5).replace('scss', 'css');
                files[`./cartridges/${path.basename(cartridge)}/cartridge/static/` + location] = file;
            }
        });
    });

    return files;
};

var cartridges = getCartridges();
var jsFiles = getFiles(cartridges, 'js');
var scssFiles = getFiles(cartridges, 'scss');

var bootstrapPackages = {
    Alert: 'exports-loader?Alert!bootstrap/js/src/alert',
    // Button: 'exports-loader?Button!bootstrap/js/src/button',
    Carousel: 'exports-loader?Carousel!bootstrap/js/src/carousel',
    Collapse: 'exports-loader?Collapse!bootstrap/js/src/collapse',
    // Dropdown: 'exports-loader?Dropdown!bootstrap/js/src/dropdown',
    Modal: 'exports-loader?Modal!bootstrap/js/src/modal',
    // Popover: 'exports-loader?Popover!bootstrap/js/src/popover',
    Scrollspy: 'exports-loader?Scrollspy!bootstrap/js/src/scrollspy',
    Tab: 'exports-loader?Tab!bootstrap/js/src/tab',
    // Tooltip: 'exports-loader?Tooltip!bootstrap/js/src/tooltip',
    Util: 'exports-loader?Util!bootstrap/js/src/util'
};

module.exports = [{
    mode: 'development',
    name: 'js',
    entry: jsFiles,
    output: {
        path: path.resolve(__dirname),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /bootstrap(.)*\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/env'],
                        plugins: ['@babel/plugin-proposal-object-rest-spread'],
                        cacheDirectory: true
                    }
                }
            }
        ]
    },
	resolve: {
		alias: {
			base: path.resolve('cartridges/app_storefront_base/cartridge/client/default/js'),
            //poc_js: path.resolve('cartridges/app_custom_poc_sfra/cartridge/client/default/js')
		}
	},
    plugins: [new webpack.ProvidePlugin(bootstrapPackages)]
}, {
    mode: 'none',
    name: 'scss',
    entry: scssFiles,
    output: {
        path: path.resolve(__dirname),
        filename: '[name].css'
    },
    module: {
        rules: [{
            test: /\.scss$/,
            use: ExtractTextPlugin.extract({
                use: [{
                    loader: 'css-loader',
                    options: {
                        url: false,
                        minimize: true
                    }
                }, {
                    loader: 'postcss-loader',
                    options: {
                        plugins: [
                            require('autoprefixer')()
                        ]
                    }
                }, {
                    loader: 'sass-loader',
                    options: {
                        includePaths: [
                            path.resolve('node_modules'),
                            path.resolve('node_modules/flag-icon-css/sass')
                        ]
                    }
                }]
            })
        }]
    },
	resolve: {
		alias: {
			base: path.resolve('cartridges/app_storefront_base/cartridge/client/default/scss'),
			//poc_scss: path.resolve('cartridges/app_custom_poc_sfra/cartridge/client/default/scss')
		}
	},
    plugins: [
        new ExtractTextPlugin({ filename: '[name].css' })
    ]
}];
