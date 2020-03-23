const path = require('path')

const production = process.env.NODE_ENV === 'production'

module.exports = {
  mode: production ? 'production' : 'development',
  entry: './js/index.mjs',
  devtool: production ? false : 'inline-source-map',
  devServer: {
    contentBase: path.resolve(__dirname, '..'),
    publicPath: '/word-prediction/',
    openPage: 'word-prediction/'
  },
  output: {
    path: __dirname,
    filename: 'bundle.js'
  }
}
