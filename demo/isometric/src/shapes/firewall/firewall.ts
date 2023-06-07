import { Model, Function } from "@joint/decorators";
import svg from './firewall.svg';
import { CuboidShape } from '../isometric-shape';
import { GRID_SIZE } from '../../theme';

const defaultSize = {
    width: GRID_SIZE * 3,
    height: GRID_SIZE
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
export class Firewall extends CuboidShape {

    @Function()
    topXPosition(): number {
        return this.topX
    }

    @Function()
    topYPosition(): number {
        return this.topY;
    }
}
