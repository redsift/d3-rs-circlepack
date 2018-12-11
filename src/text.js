import { select } from 'd3-selection';

import { 
  display
} from '@redsift/d3-rs-theme';

const small = 1e-6;

const rounded = (rd, w, h, x, y, tlr, trr, brr, blr) => {
  const r = rd;
  
  if (x > 0 && y > 0) {
    // bottom right
    return `M ${0} ${tlr} 
    A ${tlr} ${tlr} 0 0 1 ${tlr} ${0}
    l ${(w - trr - tlr)} ${0}
    A ${trr}  ${trr} 0 0 1 ${w} ${trr}
    L ${w} ${(h - r)}
    A ${r} ${r} 0 0 1 ${w} ${h+r} 
    A ${r} ${r} 0 0 1 ${w - r} ${h}     
    L ${blr} ${h}    
    A ${blr} ${blr} 0 0 1 0 ${(h - blr)} 
    L ${0} ${tlr}  
    Z`;    
  } else if (x > 0 && y < small) {
    // top right
    return `M ${0} ${tlr} 
    A ${tlr} ${tlr} 0 0 1 ${tlr} ${0}
    l ${(w - r - tlr)} ${0}
    A ${r} ${r} 0 0 1 ${w} ${y-r} 
    A ${r} ${r} 0 0 1 ${w} ${y+r}   
    L ${w} ${(h - trr)}
    A ${trr}  ${trr} 0 0 1 ${w - trr} ${h}
    L ${blr} ${h}    
    A ${blr} ${blr} 0 0 1 0 ${(h - blr)} 
    L ${0} ${tlr}  
    Z`; 
  }  else if (x < small && y > 0) {
    // bottom left
    return `M ${0} ${tlr} 
    A ${tlr} ${tlr} 0 0 1 ${tlr} ${0}
    l ${(w - trr - tlr)} ${0}
    A ${trr}  ${trr} 0 0 1 ${w} ${trr}
    L ${w} ${(h - brr)}
    A ${brr} ${brr} 0 0 1 ${(w - brr)} ${h} 
    L ${r} ${h}    
    A ${r} ${r} 0 0 1 ${x} ${(h + r)} 
    A ${r} ${r} 0 0 1 ${x} ${y - r}
    Z`;
  } else { // both 0
    // top left
    return `M ${x} ${y - r} 
    A ${r} ${r} 0 0 1 ${x + r} ${y}
    l ${(w - trr - r)} ${y}
    A ${trr}  ${trr} 0 0 1 ${w} ${trr}
    L ${w} ${(h - brr)}
    A ${brr} ${brr} 0 0 1 ${(w - brr)} ${h} 
    L ${blr} ${h}    
    A ${blr} ${blr} 0 0 1 0 ${(h - blr)} 
    L ${x} ${y + r} 
    A ${r} ${r} 0 0 1 ${x} ${y - r}
    Z`;
  }
};

export default () => {

  let padding = 2,
    pointer = 3,
    theme = 'light',
    background = null,
    foreground = null,
    transition = null;

  let value = (x) => x;

  const _impl = (selection) => {
    let _background = background;
    if (_background == null) {
      _background = () => display[theme].background;
    } else if (typeof _background !== 'function') {
      _background = () => background;
    }

    let _foreground = foreground;
    if (_foreground == null) {
      _foreground = () => display[theme].text;
    } else if (typeof _foreground !== 'function') {
      _foreground = () => foreground;
    }    

    const pointerOffset = Math.round(pointer / 2);  

    const enter = selection.entered ? selection.entered() : selection.enter();

    //  append parent group
    const enterG = enter.append('g').attr('class', 'label');

    //  if we have passed transition, execute it on the enter selection
    if (transition) {
      transition(enterG);
    }
    
    //  append child path and text
    enterG
      .append('path')
      .attr('fill', _background);
    enterG.append('text')
      .attr('dominant-baseline', 'text-before-edge')
      .attr('transform', `translate(${padding + pointerOffset}, ${padding + pointerOffset})`)
      .attr('fill', _foreground);
    
    // make sure to include entered items in all updates
    const update = selection.merge(enterG);
    update.select('text').text(value);

    //  adjust path
    update.select('path')
      .attr('d', function () {
        if (pointer == 0) return null;

        const g = this.parentNode;

        let width = Number(g.getAttribute('layout-width'));
        let height = Number(g.getAttribute('layout-height'));

        //  if in enter phase, the parent group does not have the attributes from the layout
        //  and will exit
        if (width == 0 || height == 0) return null; // no background if no sizes

        let anchorX = Number(g.getAttribute('anchor-x'));
        let anchorY = Number(g.getAttribute('anchor-y'));

        return rounded(pointer, width, height, anchorX, anchorY, 2, 2, 2, 2);
      }); 

    //  remove on EXIT
    const exit = selection.exit();
    exit.remove();

    return update;
  };

  /**
   * @param {color or function=} v - fill function for label background
   */
  _impl.background = (...v) => v.length ? (background = v[0], _impl) : background;
  
  /**
   * @param {integer=} v - size of the anchor circle if present
   */
  _impl.pointer = (...v) => v.length ? (pointer = v[0], _impl) : pointer;
  
  /**
   * @param {integer=} v - padding around the text table
   */
  _impl.padding = (...v) => v.length ? (padding = v[0], _impl) : padding;
  
  /**
   * @param {function=} v - function to return the value to use for the text
   */
  _impl.value = (...v) => v.length ? (value = v[0], _impl) : value;
    
  /**
   * @param {function=} v - function to run on enter selection allowing for transition
   */
  _impl.transition = (...v) => v.length ? (transition = v[0], _impl) : value;
  

  return _impl;
};