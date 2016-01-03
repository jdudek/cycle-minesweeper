var path = require('path');

module.exports = {
  entry: {
    app: ['./src/index.js'],
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    publicPath: '/',
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: path.resolve(__dirname, 'src'),
      },
    ],
  },
};
