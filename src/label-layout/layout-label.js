/*
    Based on https://github.com/ColinEberhardt/d3fc-label-layout/blob/master/src/label.js
*/

import { select } from 'd3-selection';
import { scaleIdentity } from 'd3-scale';

export const functor = (d) => typeof d === 'function' ? d : () => d;

/*
    Default identify function which makes sure that similarly named nodes with
    different parents are recognised as indeed different nodes
*/
export const identityFn = (d) => {
  return d.parent ? `${d.parent.data.name}-${d.data.name}`: d.data.name;
};

export default (layoutStrategy) => {

  let decorate = () => {};
  let size = () => [0, 0];
  let position = (d) => [d.x, d.y];
  let strategy = layoutStrategy || ((x) => x);
  let component = () => {};
  let xScale = scaleIdentity();
  let yScale = scaleIdentity();
  let dataId = identityFn;

  const label = (selection) => {

    selection.each((data, index, group) => {
      let g = select(group[index]).selectAll('g.label').data(data, dataId);
      g.call(component);

      // obtain the rectangular bounding boxes for each child
      g = select(group[index]).selectAll('g.label');
      const nodes = g.nodes();

      //  compute children x, y, width and height
      const childRects = nodes
        .map((node, i) => {
          let d = select(node).datum();
          const pos = position(d, i, nodes);
          let childPos = [
            xScale(pos[0]),
            yScale(pos[1])
          ];
          let childSize = size(d, i, nodes);
          return {
            data: d.data,
            hidden: false,
            x: childPos[0],
            y: childPos[1],
            width: childSize[0],
            height: childSize[1]
          };
        });

      // apply the strategy to derive the layout. The strategy does not change the order
      // or number of label.
      const layout = strategy(childRects);

      //  update labels positions and metadata
      g.style('display', (_, i) => (layout[i].hidden ? 'none' : 'inherit'))
        .attr('transform', (_, i) => 'translate(' + layout[i].x + ', ' + layout[i].y + ')')
        // set the layout width / height so that children can use SVG layout if required
        .attr('layout-width', (_, i) => layout[i].width)
        .attr('layout-height', (_, i) => layout[i].height)
        .attr('anchor-x', (d, i) => childRects[i].x - layout[i].x)
        .attr('anchor-y', (d, i) => childRects[i].y - layout[i].y);
        
      g.call(component);

      decorate(g, data, index);
    });
  };

  label.size = (...args) => {
    if (!args.length) {
      return size;
    }
    size = functor(args[0]);
    return label;
  };

  label.position = (...args) => {
    if (!args.length) {
      return position;
    }
    position = functor(args[0]);
    return label;
  };

  label.component = (...args) => {
    if (!args.length) {
      return component;
    }
    component = args[0];
    return label;
  };

  label.decorate = (...args) => {
    if (!args.length) {
      return decorate;
    }
    decorate = args[0];
    return label;
  };

  label.xScale = (...args) => {
    if (!args.length) {
      return xScale;
    }
    xScale = args[0];
    return label;
  };

  label.yScale = (...args) => {
    if (!args.length) {
      return yScale;
    }
    yScale = args[0];
    return label;
  };

  label.dataId = (...args) => {
    if (!args.length) {
      return dataId;
    }
    dataId = args[0];
    return label;
  };

  return label;
};
