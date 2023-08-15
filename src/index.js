export {
  version
} from '../package.json';


export {
  default as html
} from './circlepack.js';


export {
  default as text
} from './text.js';


/**
* Export label placing strategies and label remove strategies
*/
export {
  default as layoutRemoveOverlaps
} from './label-layout/custom-remove-layout.js';

export {
  default as labelPlacementStrategies
} from './label-layout/label-placement-strategies.js';

export {
  default as labelRemovalStrategies
} from './label-layout/label-removal-strategies.js';