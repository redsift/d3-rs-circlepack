/*
	Adaptation of the d3fc layoutRemoveOverlaps strategy (@see https://github.com/ColinEberhardt/d3fc-label-layout)
	which allows for custom resolution of which nodes should be removed.
*/
import { rebindAll } from '@d3fc/d3fc-rebind';
import { scan } from 'd3-array';

import { collisionArea } from './utils.js';

export default (adaptedStrategy, removalSortingStrategy) => {

    adaptedStrategy = adaptedStrategy || ((x) => x);

    const removeOverlaps = (layout) => {
        let adjustedLayout = adaptedStrategy(layout);

        //  make sure to add data back
        adjustedLayout = adjustedLayout.map((l, i) => {
            l.data = layout[i].data;
            return l;
        });
        
        while (true) {
            // find the collision area for all overlapping rectangles, hiding the one
            // with the greatest overlap
            const visible = adjustedLayout.filter((d) => !d.hidden);
            const collisions = visible.map((d, i) => [d, collisionArea(visible, i)]);

            // filter out all collisions with no collision
            const notNullCollisions = collisions.filter((c) => c[1] > 0); 

            // find out the maximum collision based on the whatever the removal sorting strategy is
            const leastValueIndex = scan(notNullCollisions, removalSortingStrategy);
            const maximumCollision = notNullCollisions[leastValueIndex];
            
            if (notNullCollisions.length > 0) {
                maximumCollision[0].hidden = true;
            } else {
                break;
            }
				}

        return adjustedLayout;
    };

    rebindAll(removeOverlaps, adaptedStrategy);

    return removeOverlaps;
};

