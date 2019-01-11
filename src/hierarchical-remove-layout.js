import { rebindAll } from '@d3fc/d3fc-rebind';
import { sum, scan } from 'd3-array';

//  import { collisionArea } from '@d3fc/d3fc-lable-layout/src/util/collision';

var isIntersecting = function isIntersecting(a, b) {
    return !(a.x >= b.x + b.width || a.x + a.width <= b.x || a.y >= b.y + b.height || a.y + a.height <= b.y);
};

var intersect = (function (a, b) {
    if (isIntersecting(a, b)) {
        var left = Math.max(a.x, b.x);
        var right = Math.min(a.x + a.width, b.x + b.width);
        var top = Math.max(a.y, b.y);
        var bottom = Math.min(a.y + a.height, b.y + b.height);
        return (right - left) * (bottom - top);
    } else {
        return 0;
    }
});

// computes the area of overlap between the rectangle with the given index with the
// rectangles in the array
export const collisionArea = (rectangles, index) =>  sum(
    rectangles.map((d, i) => (index === i) ? 0 : intersect(rectangles[index], d))
);


const getNodeChildrenLen = (node) => {
    if (!node[0] || !node[0].data) {
        return 0;
    }

    const data = node[0].data;
    return (data.children) ? data.children.length : 0; 
};

const getNodeDeepChildrenLen = (node) => {
    if (!node[0] || !node[0].data) {
        return 0;
    }

    const data = node[0].data;
    
    let len = 0;
    if (data.children) {
        len += data.children.length;

        //  add children into the calculation
        data.children.forEach((d) => {
            len += getNodeDeepChildrenLen([d, 0]);
        });
    }

    return len;
};


const compareNodeChildren = (a, b) => {
    const aLen = getNodeDeepChildrenLen(a);
    const bLen = getNodeDeepChildrenLen(b);
   
    return aLen - bLen;
};

const scanForObject = (array, comparator) => array[scan(array, comparator)];

export default (adaptedStrategy) => {

    adaptedStrategy = adaptedStrategy || ((x) => x);

    const removeOverlaps = (layout) => {
        console.log('layout', layout);
        let adjustedLayout = adaptedStrategy(layout);

        //  make sure to add data back
        adjustedLayout = adjustedLayout.map((l, i) => {
            l.data = layout[i].data;
            return l;
        });
        
        let z = 0;
        while (true && z < 10000) {
            // find the collision area for all overlapping rectangles, hiding the one
            // with the greatest overlap
            const visible = adjustedLayout.filter((d) => !d.hidden);
            const collisions = visible.map((d, i) => [d, collisionArea(visible, i)]);
            //  console.log('collisions', collisions);

            // filter out all collisions with no collision
            const notNullCollisions = collisions.filter((c) => c[1] > 0); 

            //  find out the collision 
            const maximumCollision = scanForObject(notNullCollisions, compareNodeChildren);
            
            //  console.log('maximumCollision', maximumCollision);
            //  console.log('maximumCollision', maximumCollision[0].data);

            //  if (maximumCollision[1] > 0) {

            if (notNullCollisions.length > 0) {
                //  console.log('hiding feature', maximumCollision[0].data);
                maximumCollision[0].hidden = true;
            } else {
                break;
            }

            if (z > 10000) {
                console.log('help!!');
                break;
            }

            z++;
        }

        //  console.log('layout2', adjustedLayout);

        return adjustedLayout;
    };

    rebindAll(removeOverlaps, adaptedStrategy);

    return removeOverlaps;
};

