import { g, elementTools } from 'jointjs';
import { Model, Function } from '@joint/decorators';
import svg from './user.svg';
import IsometricShape, { CONNECT_KEY } from '../isometric-shape';
import { CONNECT_TOOL_PRESET } from '../../tools';
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

export class User extends IsometricShape {

    constructor(...args: any[]) {
        super(...args);
        this.tools = {
            [CONNECT_KEY]: new elementTools.Connect(CONNECT_TOOL_PRESET)
        };
    }

    _getHeadPosition(isometricHeight: number): { start: g.Point, end: g.Point, dx: number } {
        const { width, height } = this.size();

        const curve = new g.Curve(
            new g.Point(width, height),
            new g.Point(width - isometricHeight, height - isometricHeight),
            new g.Point(-isometricHeight, height - isometricHeight),
            new g.Point(0, height)
        );

        const { divider: { x, y } } = curve.getSkeletonPoints(0.6);
        const dx = width * 3 / 4;

        return {
            start: new g.Point(x - dx / 2, y - dx / 8),
            end: new g.Point(x + dx / 2, y - dx / 8),
            dx
        }
    }

    @Function()
    bodySideData(isometricHeight: number): string {
        const { width, height } = this.size();

        return `
            M ${width} ${height}
            L ${width} ${0.75 * height}
            C ${width - isometricHeight + 0.25 * height} ${height - isometricHeight} ${-isometricHeight + 0.25 * height} ${height - isometricHeight - 0.25 * height} 0 ${height * 0.75}
            Z
        `
    }

    @Function()
    bodyFrontData(isometricHeight: number): string {
        const { width, height } = this.size();

        return `
            M 0 ${height}
            L ${width} ${height}
            C ${width - isometricHeight} ${height - isometricHeight} ${-isometricHeight} ${height - isometricHeight} 0 ${height}
            `
    }

    @Function()
    headFrontData(isometricHeight: number): string {
        const angle = -60;

        const { start, dx } = this._getHeadPosition(isometricHeight)

        return `
            M ${start.x} ${start.y}
            a 1 2 ${angle} 0 0 ${dx} 0
            a 1 2 ${angle} 0 0 ${-dx} 0
        `
    }

    @Function()
    headSideData(isometricHeight: number): string {
        const { start, dx } = this._getHeadPosition(isometricHeight);

        const angle = -60;
        const offset = this.size().width / 10;

        return `
            M ${start.x} ${start.y - offset}
            a 1 2 ${angle} 0 0 ${dx} 0
            a 1 2 ${angle} 0 0 ${-dx} 0
        `
    }
}
