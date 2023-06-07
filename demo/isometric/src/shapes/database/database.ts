import { Model, Function } from '@joint/decorators';
import svg from './database.svg';
import { CylinderShape } from '../isometric-shape';
import { GRID_SIZE } from '../../theme';

const defaultSize = {
    width: GRID_SIZE,
    height: GRID_SIZE
};

const defaultIsometricHeight = GRID_SIZE;

@Model({
    attributes: {
        size: defaultSize,
        defaultSize,
        defaultIsometricHeight,
        isometricHeight: defaultIsometricHeight,
    },
    template: svg
})
export class Database extends CylinderShape {

    @Function()
    topImageXPosition(): number {
        return this.topX;
    }

    @Function()
    topImageYPosition(): number {
        return this.topY;
    }

    @Function()
    getSideData(): string {
        return this.sideData;
    }

    @Function()
    topCenterX(): number {
        return this.topCenter.x;
    }

    @Function()
    topCenterY(): number {
        return this.topCenter.y;
    }
}


