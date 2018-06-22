
import { select } from 'd3-selection';
import { hierarchy, pack } from 'd3-hierarchy';
import { interpolateZoom } from 'd3-interpolate';
import { scaleOrdinal } from 'd3-scale';

import { body as tip } from '@redsift/d3-rs-tip';

import { html as svg } from '@redsift/d3-rs-svg';
import { 
  presentation10,
  display,
  fonts,
  widths,
} from '@redsift/d3-rs-theme';

const DEFAULT_SIZE = 500;
const DEFAULT_ASPECT = 1.0;
const DEFAULT_MARGIN = 32;
const DEFAULT_TIP_OFFSET = 7;

export default function sankeyChart(id) {
  let classed = 'chart-circlepack', 
      theme = 'light',
      background = undefined,
      width = DEFAULT_SIZE,
      height = null,
      
      margin = DEFAULT_MARGIN,
      style = undefined,
      scale = 1.0,
      importFonts = true,
      onClick = null,
      padding = 2.0,
      circleFill = null,
      label = null, 
      tipHtml = null,
      animated = false,
      center = null;
  
  let tid = null;
  if (id) tid = 'tip-' + id;
  let rtip = tip(tid)

  function _impl(context) {
    let selection = context.selection ? context.selection() : context,
        transition = (context.selection !== undefined);
  
    let _background = background;
    if (_background === undefined) {
      _background = display[theme].background;
    }
    
    let _label = label;
    if (_label == null) {
      _label = (d) => d.data.name;
    } else if (typeof(_label) !== 'function') {
      _label = () => label;
    }

    let _circleFill = circleFill;
    if (_circleFill == null) {
      const color = scaleOrdinal(presentation10.standard);
      _circleFill = (d) => color(d.depth);
    } else if (typeof(_circleFill) !== 'function') {
      _circleFill = () => circleFill;
    }

    rtip.offset([ -DEFAULT_TIP_OFFSET, 1 ]).style(null).html(tipHtml).transition(333);

    selection.each(function() {
      let node = select(this);  

      let her = node.datum();

      let sh = height || Math.round(width * DEFAULT_ASPECT);
      
      // SVG element
      let sid = null;
      if (id) sid = 'svg-' + id;

      let root = svg(sid)
                  .width(width).height(sh).margin(margin).scale(scale)
                  .background(_background)
                  .overflow(false);
      let tnode = node;
      if (transition === true) {
        tnode = node.transition(context);
      }
    
      let w = root.childWidth(),
          h = root.childHeight();        
      let _style = style;
      if (_style === undefined) {
        // build a style sheet from the embedded charts
        _style = [ _impl, rtip ].filter(c => c != null).reduce((p, c) => p + c.defaultStyle(theme, w), '');
      }    

      root.style(_style);
      tnode.call(root);

      let snode = node.select(root.self());
      let elmS = snode.select(root.child());
      
      elmS.call(rtip);

      let g = elmS.select(_impl.self())
      if (g.empty()) {
        g = elmS.append('g').attr('class', classed).attr('id', id);
      }

      // -- start
      let tg = g;
      if (transition === true) {
        tg = g.transition(context);
      }
      tg.attr('transform', 'translate(' + w / 2 + ',' + h / 2 + ')')

      let packed = pack().size([w, h]).padding(padding);
      let tree = hierarchy(her)
                  .sum(d => d.size)
                  .sort((a, b) =>  b.value - a.value);

      let computed = packed(tree).descendants();

      if (center == null) {
        center = tree;
      }

      let circle = g.selectAll('circle').data(computed);

      // background select call catch          
      snode.select('rect.background').on('click', () => {
        if (onClick) {
          onClick(null);
        }
      });

      // Enter any new nodes at the parent's previous position.
      let circleEnter = circle.enter().append('circle')
          .attr('class',  d => d.parent ? d.children ? 'node node--middle' : 'node node--leaf' : 'node node--root')
          .attr('fill-opacity', 1.0)
          .style('fill',  _circleFill)
          .on('click', (d) => {
            if (onClick) {
              onClick(d);
            }
          });

      let circleUpdate = circleEnter.merge(circle);

      circleUpdate.on('mouseover', function (d) {
        if (rtip.html() == null) return;
        rtip.show.apply(this, [ d ]);
      })
      .on('mouseout', function () {
        rtip.hide.apply(this);
      });

      if (transition === true) {
        circleUpdate = circleUpdate.transition(context);
      }

      let k = w / (center.r*2);
      
      circleUpdate.attr('r',  d => d.r * k)
                  .attr('transform',  d => 'translate(' + (d.x - center.x) * k + ',' + (d.y - center.y) * k + ')');

      let circleExit = circle.exit();
      if (transition === true) {
        circleExit = circleExit.transition(context);
      }

      circleExit
          .attr('fill-opacity', 0.0)
          .remove();
    
      rtip.hide();

    });
  }
  
  _impl.self = function() { return 'g' + (id ?  '#' + id : '.' + classed); }

  _impl.id = function() {
    return id;
  };

  _impl.defaultStyle = (_theme, _width) => `
                  ${_impl.importFonts() ? fonts.variable.cssImport : ''}  
                  ${_impl.self()} { 
                    font-size: ${fonts.variable.sizeForWidth(_width)};
                  }
                  ${_impl.self()} text.default { 
                    font-family: ${fonts.variable.family};
                    font-weight: ${fonts.variable.weightColor};  
                    fill: ${display[_theme].text}                
                  }
                  ${_impl.self()} text::selection {
                    fill-opacity: 1.0; 
                  }
                  ${_impl.self()} circle.node:hover {
                    stroke:${display[_theme].axis};
                    stroke-width: ${widths.axis};
                  }
                  ${_impl.self()} .label,
                  ${_impl.self()} .node--root,
                  ${_impl.self()} .node--leaf {
                    pointer-events: none;
                  }
                `;
  
  _impl.importFonts = function(value) {
    return arguments.length ? (importFonts = value, _impl) : importFonts;
  };

  _impl.classed = function(value) {
    return arguments.length ? (classed = value, _impl) : classed;
  };
    
  _impl.background = function(value) {
    return arguments.length ? (background = value, _impl) : background;
  };

  _impl.theme = function(value) {
    return arguments.length ? (theme = value, _impl) : theme;
  };  

  _impl.size = function(value) {
    return arguments.length ? (width = value, height = null, _impl) : width;
  };
    
  _impl.width = function(value) {
    return arguments.length ? (width = value, _impl) : width;
  };  

  _impl.height = function(value) {
    return arguments.length ? (height = value, _impl) : height;
  }; 

  _impl.scale = function(value) {
    return arguments.length ? (scale = value, _impl) : scale;
  }; 

  _impl.margin = function(value) {
    return arguments.length ? (margin = value, _impl) : margin;
  };   

  _impl.style = function(value) {
    return arguments.length ? (style = value, _impl) : style;
  }; 
  
  _impl.onClick = function(value) {
    return arguments.length ? (onClick = value, _impl) : onClick;
  };   

  _impl.padding = function(value) {
    return arguments.length ? (padding = value, _impl) : padding;
  }; 
  
  _impl.circleFill = function(value) {
    return arguments.length ? (circleFill = value, _impl) : circleFill;
  };

  _impl.center = function(value) {
    return arguments.length ? (center = value, _impl) : center;
  };
  
  _impl.label = function(value) {
    return arguments.length ? (label = value, _impl) : label;
  }; 

  _impl.tipHtml = function(value) {
    return arguments.length ? (tipHtml = value, _impl) : tipHtml;
  };  

  _impl.animated = function(value) {
    return arguments.length ? (animated = value, _impl) : animated;
  };  
  

  return _impl;
}