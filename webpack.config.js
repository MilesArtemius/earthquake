const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: ["@babel/polyfill", "./src/game.js"],
    output: {
        path: path.join(__dirname, './public/'),
        filename: "./all.min.js"
    },
    optimization: {
        minimize: true
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                exclude: /(node_modules)/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader'
                    }
                ]
            },
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                }
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyPlugin({
            patterns: [
                { from: "./src/files/", to: "./files/" },
                { from: "./src/index.html", to: "./index.html" },
                { from: "./src/favicon.ico", to: "./favicon.ico" }
            ]
        })
    ]
}
