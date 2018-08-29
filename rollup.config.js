
import {terser} from 'rollup-plugin-terser';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

import * as meta from './package.json';

// Specify modules that should be bundlled in the target umd
const bundleModules = [ /^d3fc-/, 'bezier-easing' ];

// List all D3 modules so they can be excluded and mapped to the D3 global variable
const d3Modules = [
  'd3-array', 'd3-axis', 'd3-brush', 'd3-chord', 'd3-collection', 'd3-color', 'd3-contour', 'd3-dispatch', 'd3-drag', 'd3-dsv', 'd3-ease', 'd3-fetch', 'd3-force',
  'd3-format', 'd3-geo', 'd3-hierarchy', 'd3-interpolate', 'd3-path', 'd3-polygon', 'd3-quadtree', 'd3-random', 'd3-scale', 'd3-scale-chromatic', 'd3-selection', 'd3-shape', 'd3-time', 'd3-time-format', 'd3-timer', 'd3-transition', 'd3-voronoi', 'd3-zoom'
];

const config = {
  input: 'index.js',
  external: d3Modules,
  output: {
    file: `dist/${meta.name}.umd.js`,
    name: meta.name.match(/^(@.*\/)?(.*)$/)[2].replace(/-/g, '_'), // remove leading org and replace - with _
    format: 'umd',
    indent: false,
    extend: true,
    banner: `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author.name}`,
    globals: Object.assign({}, ...d3Modules.map(key => ({[key]: 'd3'})))
  },
  plugins: [ 
    json({
      include: [ '**/package.json' , 'node_modules/**/*.json' ], 
      exclude: [  ]
    }),
    resolve({ 
      only: [ /^@redsift\/.*$/, ...bundleModules ],
      jsnext: true, 
      extensions: [ '.js' ] 
    }) ,
    commonjs()
  ]
};

export default [
  config,
  {
    ...config,
    output: {
      ...config.output,
      file: `dist/${meta.name}.umd.min.js`,
      sourcemap: true
    },
    plugins: [
      ...config.plugins,
      terser({
        output: {
          preamble: config.output.banner
        }
      })
    ],
  }
];