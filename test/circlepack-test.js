const tape = require('@redsift/tape-reel')('<div id=\'test\'></div>'),
  d3 = require('d3-selection'),
  sankey = require('../');

// This test should be on all brick compatable charts
tape('html() empty state', function(t) {
  var host = sankey.html();
  var el = d3.select('#test');
  el.call(host);
    
  t.equal(el.selectAll('svg').size(), 1);
    
  // should have an entry
  t.equal(el.selectAll('g.chart-circlepack').size(), 1);
        
  t.end();
});

