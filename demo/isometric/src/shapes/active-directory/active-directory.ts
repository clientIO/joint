import { Model } from '@joint/decorators';
import svg from './active-directory.svg';
import { PyramidShape } from '../isometric-shape';
import { GRID_SIZE } from '../../theme';

const defaultSize = {
    width: GRID_SIZE * 2,
    height: GRID_SIZE * 2
};

const defaultIsometricHeight = GRID_SIZE * 3;

@Model({
    attributes: {
        size: defaultSize,
        defaultSize,
        defaultIsometricHeight,
        isometricHeight: defaultIsometricHeight,
    },
    template: svg
})

export class ActiveDirectory extends PyramidShape {

}
