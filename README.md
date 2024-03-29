# d3-rs-circlepack

[![Circle CI](https://img.shields.io/circleci/project/redsift/d3-rs-circlepack.svg?style=flat-square)](https://circleci.com/gh/redsift/d3-rs-circlepack)
[![npm](https://img.shields.io/npm/v/@redsift/d3-rs-circlepack.svg?style=flat-square)](https://www.npmjs.com/package/@redsift/d3-rs-circlepack)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://raw.githubusercontent.com/redsift/d3-rs-circlepack/master/LICENSE)

`d3-rs-circlepack` generate a circlepack flow via the D3 reusable chart convention.

## Example

[View @redsift/d3-rs-√ on Codepen](http://codepen.io/collection/DgkEpa/)

## Usage

### Browser

    <script src="//static.redsift.io/reusable/d3-rs-circlepack/latest/d3-rs-circlepack.umd-es2015.min.js"></script>
    <script>
        var chart = d3_rs_tree.html();
        d3.select('body').datum([ 1, 2, 3, 10, 100 ]).call(chart);
    </script>

### ES6

    import { html as chart } from "@redsift/d3-rs-circlepack";
    let eml = chart();
    ...

### Require

    var chart = require("@redsift/d3-rs-circlepack");
    var eml = chart.html();
    ...
