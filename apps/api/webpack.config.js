const path = require('path');

module.exports = (options, webpack) => {
  return {
    ...options,
    entry: './src/main.ts',
    externals: [],
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
      ...options.resolve,
      alias: {
        '@workspace/contracts': path.resolve(__dirname, '../../packages/contracts/src'),
        '@workspace/db': path.resolve(__dirname, '../../packages/db/src'),
      },
    },
  };
};
