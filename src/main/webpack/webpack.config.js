const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
  entry: ['./webpack.index.js'],
  stats: 'errors-warnings',
  output: {
    path: path.resolve(__dirname, 'dist'),
    library: 'grapheditor',
    libraryTarget: 'umd',
    filename: 'grapheditor.js',
    umdNamedDefine: true,
    globalObject: 'this'
  },
  module: {
    rules: [{
      test: /\.(js)$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: ['@babel/plugin-proposal-object-rest-spread']
        }
      }
    }]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Graph Editor - Draw.io',
      template: './index.html'
    }),
    getCopyConfig([{
      from: './webpackExtensions',
      to: './mxgraph/webpackExtensions',
      isJsInclude: true,
      context: 'root'
    }, {
      from: 'math',
      to: 'mxgraph/grapheditor/math',
      isJsInclude: true
    }, {
      from: 'mxgraph',
      to: 'mxgraph',
      isJsInclude: true
    }, {
      from: 'images',
      to: 'mxgraph/images',
      isJsInclude: true
    }, {
      from: 'img',
      to: 'mxgraph/img',
      isJsInclude: true
    }, {
      from: 'js',
      to: 'mxgraph/grapheditor',
      isJsInclude: true
    }, {
      from: 'resources',
      to: 'mxgraph/resources',
      isJsInclude: true
    }, {
      from: 'styles',
      to: 'mxgraph/styles',
      isJsInclude: true
    }, {
      from: 'stencils',
      to: 'mxgraph/stencils',
      isJsInclude: true
    }, {
      from: 'shapes',
      to: 'mxgraph/shapes',
      isJsInclude: true
    }])
  ]
};

function getCopyConfig(copyItems) {
  let patterns = []

  copyItems.forEach(element => {
    patterns.push({
      from: element.from,
      to: element.to,
      // _to: "assets/" + element.to,
      context: (element.context === 'root' ? "" : "../webapp"),
      globOptions: {
        dot: true,
        gitignore: true,
        ignore: [(element.isJsInclude ? '**/*.jss' : "**/*.js"), "**/*.html", "**/ignored-directory/**"]
      }
    })
  });
  return new CopyPlugin({
    patterns: patterns
  })
}

// {
//   from: 'math',
//   to: 'mxgraph/grapheditor/math',
//   isJsInclude: true
// },

// {
//   from: 'js/grapheditor',
//   to: 'mxgraph/grapheditor',
//   isJsInclude: true
// }, {
//   from: 'js/deflate',
//   to: 'mxgraph/grapheditor/deflate',
//   isJsInclude: true
// }, {
//   from: 'js/sanitizer',
//   to: 'mxgraph/grapheditor/sanitizer',
//   isJsInclude: true
// }, {
//   from: 'js/jscolor',
//   to: 'mxgraph/grapheditor/jscolor',
//   isJsInclude: true
// }, {
//   from: 'js/cryptojs',
//   to: 'mxgraph/grapheditor/cryptojs',
//   isJsInclude: true
// }, {
//   from: 'js/croppie',
//   to: 'mxgraph/grapheditor/croppie',
//   isJsInclude: true
// }, {
//   from: 'js/rough',
//   to: 'mxgraph/grapheditor/rough',
//   isJsInclude: true
// }, {
//   from: 'js/spin',
//   to: 'mxgraph/grapheditor/spin',
//   isJsInclude: true
// }, {
//   from: 'js/jszip',
//   to: 'mxgraph/grapheditor/jszip',
//   isJsInclude: true
// }, {
//   from: 'js/orgchart',
//   to: 'mxgraph/grapheditor/orgchart',
//   isJsInclude: true
// }, {
//   from: 'js/diagramly',
//   to: 'mxgraph/grapheditor/diagramly',
//   isJsInclude: true
// }

// {
//   from: "mxgraph",
//   to: "assets/mxgraph",
//   context: "../webapp",
//   globOptions: {
//     dot: true,
//     gitignore: true,
//     ignore: ["**/*.jss", "**/*.html", "**/ignored-directory/**"]
//   }
// },
// {
//   from: "js/grapheditor",
//   to: "assets/mxgraph/grapheditor",
//   context: "../webapp",
//   globOptions: {
//     dot: true,
//     gitignore: true,
//     ignore: ["**/*.html", "**/ignored-directory/**"]
//   }
// }

// 'errors-only'	none	Only output when errors happen
// 'errors-warnings'	none	Only output errors and warnings happen
// 'minimal'	none	Only output when errors or new compilation happen
// 'none'	false	Output nothing
// 'normal'	true	Standard output
// 'verbose'	none	Output everything
// 'detailed'	none	Output everything except chunkModules and chunkRootModules
// 'summary'	none	Output webpack version, warnings count and errors coun