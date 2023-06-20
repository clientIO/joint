import { Model, Function } from '@joint/decorators';
import svg from './computer.svg';
import { CuboidShape } from '../isometric-shape';
import { GRID_SIZE } from '../../theme';

const defaultSize = {
    width: GRID_SIZE,
    height: GRID_SIZE * 2
};

const defaultIsometricHeight = GRID_SIZE * 2;

@Model({
    attributes: {
        size: defaultSize,
        defaultSize,
        defaultIsometricHeight,
        isometricHeight: defaultIsometricHeight,
    },
    template: svg
})
export class Computer extends CuboidShape {

    @Function()
    topXPosition(): number {
        return this.topX;
    }

    @Function()
    topYPosition(): number {
        return this.topY;
    }
}
