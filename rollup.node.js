/*eslint no-console: ["error", { allow: ["warn", "error"] }] */

const fs = require('fs'),
  rollup = require('rollup'),
  meta = require('./package.json');

rollup.rollup({
  input: 'index.js',
  external: Object.keys(meta.dependencies)
}).then(function(bundle) {
  return bundle.generate({format: 'cjs'});
}).then(function(result) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(`dist/${meta.name}.cjs.js`, result.code, 'utf8', function(error) {
      if (error) return reject(error);
      else resolve();
    });
  });
}).catch(abort);

function abort(error) {
  console.error(error.stack);
  process.exit(-1);
}