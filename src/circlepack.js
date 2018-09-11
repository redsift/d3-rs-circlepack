
import { select } from 'd3-selection';
import { hierarchy, pack } from 'd3-hierarchy';
import { scaleLinear } from 'd3-scale';

import { body as tip } from '@redsift/d3-rs-tip';

import { html as svg } from '@redsift/d3-rs-svg';
import { 
  presentation10,
  display,
  fonts,
  widths,
} from '@redsift/d3-rs-theme';

import { layoutTextLabel, layoutGreedy,
  layoutLabel, layoutRemoveOverlaps } from '@d3fc/d3fc-label-layout';

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
    center = null,
    sum = (d) => d.size,
    dataId = (d, i) => d.id == null ? i : d.id,
    decorateLabel = null,
    labelStrategy = layoutRemoveOverlaps(layoutGreedy()),
    labelPadding = 4.0,
    labelValue = (d) => d.data.name;
  
  let tid = null;
  if (id) tid = 'tip-' + id;
  let rtip = tip(tid);

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
      const color = scaleLinear().domain([0, 5]).range([ presentation10.standard[presentation10.names.blue], presentation10.standard[presentation10.names.yellow] ]);
      _circleFill = (d) => color(d.depth % 5);
    } else if (typeof(_circleFill) !== 'function') {
      _circleFill = () => circleFill;
    }

    rtip.offset([ -DEFAULT_TIP_OFFSET, 1 ]).style(null).html(tipHtml).transition(333);

    selection.each(function() {
      let node = select(this);  

      let her = node.datum() || {};

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

      let g = elmS.select(_impl.self());
      if (g.empty()) {
        g = elmS.append('g').attr('class', classed).attr('id', id);
        g.append('g').attr('class', 'circles');
        g.append('g').attr('class', 'labels');
      }

      // -- start
      let tg = g;
      if (transition === true) {
        tg = g.transition(context);
      }
      tg.attr('transform', 'translate(' + w / 2 + ',' + h / 2 + ')');

      let packed = pack().size([w, h]).padding(padding);
      let tree = hierarchy(her)
        .sum(sum)
        .sort((a, b) =>  b.value - a.value);

      let computed = packed(tree).descendants();

      let _center = center;
      if (_center == null) {
        _center = tree;
      }

      let forceLabel = false;
      if (_center.children == null || _center.children.length == 0) {
        forceLabel = true;
      }

      // background select call catch          
      snode.select('rect.background').on('click', () => {
        if (onClick) {
          onClick(null);
        }
      });

      let circle = g.select('g.circles').selectAll('circle').data(computed, (d, i) => dataId(d.data, i));
      
      let k = w / (_center.r*2);

      // Enter any new nodes at the parent's previous position.
      let circleEnter = circle.enter().append('circle')
        .attr('fill-opacity', 0.0)
        .attr('r',  d => d.r * k)
        .attr('transform',  d => 'translate(' + (d.x - _center.x) * k + ',' + (d.y - _center.y) * k + ')');

      let circleUpdate = circleEnter.merge(circle);

      circleUpdate.on('mouseover', function (d) {
        if (rtip.html() == null) return;
        rtip.show.apply(this, [ d ]);
      })
        .on('mouseout', function () {
          rtip.hide.apply(this);
        })
        .on('click', (d) => {
          if (onClick) {
            onClick(d);
          }
        });

      if (transition === true) {
        circleUpdate = circleUpdate.transition(context);
      }
      
      circleUpdate.attr('r',  d => d.r * k)
        .attr('class',  d => d.parent ? d.children ? 'node node--middle' : 'node node--leaf' : 'node node--root')
        .attr('transform',  d => 'translate(' + (d.x - _center.x) * k + ',' + (d.y - _center.y) * k + ')')
        .attr('fill-opacity', 1.0)
        .attr('fill',  _circleFill);          


      let circleExit = circle.exit();
      if (transition === true) {
        circleExit = circleExit.transition(context);
      }

      circleExit
        .attr('fill-opacity', 0.0)
        .remove();
      
      const hasChildren = (d) => d.children != null &&  d.children.length > 0;

      // the component used to render each label
      const textLabel = layoutTextLabel()
        .padding(labelPadding)
        .value(labelValue); 

      // create the layout that positions the labels
      const labels = layoutLabel(labelStrategy)
        .size((d, i, g) => {
          // measure the label and add the required padding
          const node = g[i].getElementsByTagName('text')[0];

          let textSize = null;
          if (node.getBBox) {
            textSize = node.getBBox();
          } else {
            textSize = { width: 10, height: 10 }; // TODO: temp hack for JSDOM testing
          }
          return [textSize.width + labelPadding * 2, textSize.height + labelPadding * 2];
        })
        .position(d => {
          if (hasChildren(d)) {
            const r = (d.r - padding / 2.0) * 0.7071067812; // sin(45deg)
            return [(d.x - _center.x - r) * k, (d.y - _center.y - r) * k];
          }
          return [(d.x - _center.x) * k, (d.y - _center.y) * k];
        })
        .decorate(s => {
          // s.enter().attr('fill-opacity', 0.0);

          if (decorateLabel) decorateLabel(s);
        })
        .component(textLabel);
      
      const isData = (a, b) => a != null && b != null ? dataId(a.data, a.data) == dataId(b.data, b.data): false;


      const shouldDisplayLabel = d => d.parent == _center || 
        isData(d.parent, _center) || 
        (forceLabel && isData(d, _center));

      let label = g.select('g.labels').datum(computed.filter(shouldDisplayLabel));
      if (transition === true) {
        label = label.transition(context);
      }
      label.call(labels);

      /* TODO: Data ID is a problem
      let label = g.select('g.labels').selectAll('text').data(computed, (d, i) => dataId(d.data, i));

      let labelEnter = label.enter().append('text')
        .attr('transform',  d => 'translate(' + (d.x - _center.x) * k + ',' + (d.y - _center.y) * k + ')')
        .attr('fill-opacity', 0.0);

      let labelUpdate = labelEnter.merge(label);
      labelUpdate.text(d => d.data.name); //todo: param

      if (transition === true) {
        labelUpdate = labelUpdate.transition(context);
      }

      labelUpdate.attr('fill-opacity', d =>  d.parent == _center || 
                                            isData(d.parent, _center) || 
                                            (forceLabel && isData(d, _center)) ? 
                                            1.0 : 0.0)
          .attr('transform',  d => 'translate(' + (d.x - _center.x) * k + ',' + (d.y - _center.y - (d.children && d.children.length > 0 ? d.r / 2 : 0.0)) * k + ')')
          .attr('fill', () => display[theme].text); //todo: param

      let labelExit = label.exit();
        if (transition === true) {
          labelExit = labelExit.transition(context);
        }
  
      labelExit
          .attr('fill-opacity', 0.0)
          .remove();
      */
      rtip.hide();

    });
  }

  _impl.self = () => `g${id ?  '#' + id : '.' + classed}`;
  _impl.id = () => id;
  
  //TODO: model for text shadow based on theme
  _impl.defaultStyle = (_theme, _width) => `
                  ${_impl.importFonts() ? fonts.variable.cssImport : ''}  
                  ${_impl.self()} { 
                    font-size: ${fonts.variable.sizeForWidth(_width)};
                  }
                  ${_impl.self()} .labels { 
                    fill: ${display[_theme].lowlight};
                  }
                  ${_impl.self()} .labels text { 
                    fill: ${display[_theme].text};
                    font-family: ${fonts.variable.family};
                    font-weight: ${fonts.variable.weightColor};    
                    text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, -1px 0 0 #fff, 0 -1px 0 #fff;
                    pointer-events: none;    
                  }
                  ${_impl.self()} circle.node:hover {
                    stroke:${display[_theme].axis};
                    stroke-width: ${widths.axis};
                  }
                  ${_impl.self()} circle.node {
                    pointer-events: all;
                  }
                `;
  
  _impl.importFonts = (value) => arguments.length ? (importFonts = value, _impl) : importFonts;
  _impl.classed = (value) => arguments.length ? (classed = value, _impl) : classed;
  _impl.background = (value) => arguments.length ? (background = value, _impl) : background;
  _impl.theme = (value) => arguments.length ? (theme = value, _impl) : theme;
  _impl.size = (value) => arguments.length ? (width = value, height = null, _impl) : width;
  _impl.width = (value) => arguments.length ? (width = value, _impl) : width;
  _impl.height = (value) => arguments.length ? (height = value, _impl) : height;
  _impl.scale = (value) => arguments.length ? (scale = value, _impl) : scale;
  _impl.margin = (value) => arguments.length ? (margin = value, _impl) : margin;
  _impl.style = (value) => arguments.length ? (style = value, _impl) : style;
  _impl.onClick = (value) => arguments.length ? (onClick = value, _impl) : onClick;
  _impl.padding = (value) => arguments.length ? (padding = value, _impl) : padding;
  _impl.circleFill = (value) => arguments.length ? (circleFill = value, _impl) : circleFill;
  _impl.center = (value) => arguments.length ? (center = value, _impl) : center;
  _impl.label = (value) => arguments.length ? (label = value, _impl) : label;
  _impl.tipHtml = (value) => arguments.length ? (tipHtml = value, _impl) : tipHtml;
  _impl.animated = (value) => arguments.length ? (animated = value, _impl) : animated;
  _impl.sum = (value) => arguments.length ? (sum = value, _impl) : sum;
  _impl.dataId = (value) => arguments.length ? (dataId = value, _impl) : dataId;
  _impl.decorateLabel = (value) => arguments.length ? (decorateLabel = value, _impl) : decorateLabel;
  _impl.labelStrategy = (value) => arguments.length ? (labelStrategy = value, _impl) : labelStrategy;
  _impl.labelPadding = (value) => arguments.length ? (labelPadding = value, _impl) : labelPadding;
  _impl.labelValue = (value) => arguments.length ? (labelValue = value, _impl) : labelValue;

  return _impl;
}