export {
  version
} from './dist/package.js';


export {
  default as html
} from './src/circlepack';


export {
  default as text
} from './src/text';


/**
* Export label placing strategies and label remove strategies
*/
export {
  default as layoutRemoveOverlaps
} from './src/label-layout/custom-remove-layout.js';

export {
  default as labelPlacementStrategies
} from './src/label-layout/label-placement-strategies.js';

export {
  default as labelRemovalStrategies
} from './src/label-layout/label-removal-strategies.js';