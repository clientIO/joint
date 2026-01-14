import type { dia } from '@joint/core';
import type { BezierSeg, Ellipse } from '@msagl/core';

export function sampleBezierSeg(bezierSeg: BezierSeg): dia.Point[] {
    const vertices = [];
    // BezierSeg uses normalized [0,1] parameter space
    const sampleCount = 10;

    for (let i = 1; i <= sampleCount; i++) {
        const t = i / (sampleCount + 1);
        const point = bezierSeg.value(t);
        vertices.push({ x: point.x, y: point.y });
    }

    return vertices;
}

export function sampleEllipse(ellipse: Ellipse): dia.Point[] {
    const vertices = [];
    // Ellipse uses angle parameters (radians)
    const angleStart = ellipse.parStart;
    const angleEnd = ellipse.parEnd;
    const angleRange = angleEnd - angleStart;
    const sampleCount = 10;

    for (let i = 1; i <= sampleCount; i++) {
        const t = i / (sampleCount + 1);
        // Interpolate between the start and end angles
        const angle = angleStart + t * angleRange;
        const point = ellipse.value(angle);
        vertices.push({ x: point.x, y: point.y });
    }

    return vertices;
}
