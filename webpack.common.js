const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: {
    'popup/index': path.resolve('src/popup/index.js'),
    'scripts/background': path.resolve('src/scripts/background.js'),
    'scripts/detector/index': path.resolve('src/scripts/detector/index.js'),
    'scripts/detector/add-detector': path.resolve('src/scripts/detector/add-detector.js'),
    'scripts/content-script/index': path.resolve('src/scripts/content-script/index.js'),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
        ],
      },
      {
        type: 'assets/resource',
        test: /\.(png|jpg|jpeg|gif|woff|woff2|tff|eot|svg)$/,
      },
    ]
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('src/manifest.json'),
          to: path.resolve('dist')
        },
        {
          from: path.resolve('src/icons'),
          to: path.resolve('dist/icons'),
        },
        {
          from: path.resolve('src/images'),
          to: path.resolve('dist/images'),
        },
        {
          from: path.resolve('src/popup/bootstrap.min.css'),
          to: path.resolve('dist/popup/bootstrap.min.css'),
        },
        {
          from: path.resolve('src/popup/bootstrap.min.js'),
          to: path.resolve('dist/popup/bootstrap.min.js'),
        },
        {
          from: path.resolve('src/popup/index.css'),
          to: path.resolve('dist/popup/index.css'),
        },
        {
          from: path.resolve('src/popup/index.html'),
          to: path.resolve('dist/popup/index.html'),
        },
        {
          from: path.resolve('src/scripts/content-script/styles.js'),
          to: path.resolve('dist/scripts/content-script/styles.js'),
        },
        {
          from: path.resolve('src/scripts/utils.js'),
          to: path.resolve('dist/scripts/utils.js'),
        },
      ]
    }),
  ],
  resolve: {
    extensions: ['.js']
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
    clean: true,
  },
}