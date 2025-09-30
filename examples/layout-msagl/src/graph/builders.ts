import { dia, shapes } from '@joint/core';
import { defaultFallbackColor } from './palette';
import { LinkOptions, NodeOptions, PaletteCycler } from './types';

export const makePaletteCycler = (palette: string[]): PaletteCycler => {
    const colors = palette.length ? palette : [defaultFallbackColor];
    let index = 0;

    return {
        next: () => {
            const color = colors[index % colors.length];
            index += 1;
            return color;
        }
    };
};

export const createNode = (label: string, fill: string, options: NodeOptions = {}): dia.Element => {
    const STROKE_COLOR = '#334155';
    const LABEL_TEXT_COLOR = '#1F2937';
    const variant = options.variant ?? 'rounded';
    const width = options.width ?? (variant === 'circle' ? 72 : 150);
    const height = options.height ?? (variant === 'circle' ? 72 : 52);
    const fontSize = options.fontSize ?? (variant === 'circle' ? 12 : 13);
    const fontWeight = options.fontWeight ?? '500';
    const textColor = options.textColor ?? LABEL_TEXT_COLOR;
    const stroke = STROKE_COLOR;

    if (variant === 'circle') {
        const circle = new shapes.standard.Circle({
            size: { width, height },
            attrs: {
                body: {
                    fill,
                    stroke,
                    strokeWidth: 2,
                    magnet: true
                },
                label: {
                    text: label,
                    fill: textColor,
                    fontSize,
                    fontFamily: 'Inter, "Segoe UI", sans-serif',
                    fontWeight,
                    textWrap: {
                        width: width - 16,
                        ellipsis: true
                    }
                }
            }
        });
        return circle;
    }

    const radius = variant === 'pill' ? height / 2 : 16;

    const rectangle = new shapes.standard.Rectangle({
        size: { width, height },
        attrs: {
            body: {
                fill,
                stroke,
                strokeWidth: 2,
                rx: radius,
                ry: radius,
                magnet: true
            },
            label: {
                text: label,
                fill: textColor,
                fontSize,
                fontFamily: 'Inter, "Segoe UI", sans-serif',
                fontWeight,
                textWrap: {
                    width: width - 24,
                    ellipsis: true
                }
            }
        }
    });

    return rectangle;
};

export const createParentNode = (label: string, fill: string, size: { width: number; height: number }): dia.Element => {
    const STROKE_COLOR = '#334155';
    const LABEL_TEXT_COLOR = '#1F2937';
    const bodyFill = fill;
    const stroke = STROKE_COLOR;
    const textColor = LABEL_TEXT_COLOR;

    const node = new shapes.standard.Rectangle({
        labelSize: measureLabelText(label, { font: '16px "Inter", sans-serif', horizontalPadding: 10, verticalPadding: 10 }),
        size,
        attrs: {
            body: {
                fill: bodyFill,
                stroke,
                strokeWidth: 2,
                rx: 22,
                ry: 22,
                magnet: true
            },
            label: {
                text: label,
                fill: textColor,
                fontSize: 16,
                fontFamily: 'Inter, "Segoe UI", sans-serif',
                fontWeight: '600',
                textAnchor: 'middle',
                textVerticalAnchor: 'top',
                x: 'calc(w/2)',
                y: 10
            }
        }
    });

    return node;
};

export const createLink = (source: dia.Element, target: dia.Element, options: LinkOptions = {}): dia.Link => {
    const LINK_COLOR = '#3B4252';
    const LABEL_RECT_FILL = '#FFFFFF';
    const LABEL_RECT_STROKE = '#E5E9F0';
    const LABEL_TEXT_COLOR = '#374151';
    const color = options.color ?? LINK_COLOR;
    const thickness = options.thickness ?? 1.8;
    const showLabel = options.showLabel ?? Boolean(options.label);
    const labelText = options.label ?? `${source.attr('label/text')} → ${target.attr('label/text')}`;

    const baseConfig: any = {
        source: { id: source.id },
        target: { id: target.id },
        attrs: {
            line: {
                stroke: color,
                strokeWidth: thickness,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                targetMarker: {
                    type: 'path',
                    d: 'M 10 -5 0 0 10 5 z',
                    fill: color,
                    stroke: color
                }
            }
        }
    };

    if (showLabel) {
        Object.assign(baseConfig, {
            labelSize: measureLabelText(labelText, {
                font: '11px "Inter", sans-serif',
                horizontalPadding: 10,
                verticalPadding: 6
            }),
            labels: [
                {
                    position: {
                        distance: 0.5,
                        offset: 0
                    },
                    attrs: {
                        rect: {
                            fill: LABEL_RECT_FILL,
                            stroke: LABEL_RECT_STROKE,
                            strokeWidth: 1,
                            rx: 8,
                            ry: 8,
                            height: 'calc(h + 12)',
                            width: 'calc(w + 20)',
                            x: 'calc(x - 10)',
                            y: 'calc(y - 6)',
                            pointerEvents: 'none'
                        },
                        text: {
                            text: labelText,
                            fill: LABEL_TEXT_COLOR,
                            fontSize: 11,
                            fontFamily: 'Inter, "Segoe UI", sans-serif',
                            fontWeight: '500',
                            textAnchor: 'middle',
                            textVerticalAnchor: 'middle',
                            pointerEvents: 'none'
                        }
                    }
                }
            ]
        });
    } else {
        Object.assign(baseConfig, { labels: [] });
    }

    return new shapes.standard.Link(baseConfig);
};

export const measureLabelText = (
    text: string,
    {
        font = '11px sans-serif',
        horizontalPadding = 0,
        verticalPadding = 10
    }: {
        font?: string;
        horizontalPadding?: number;
        verticalPadding?: number;
    } = {}
): { width: number; height: number } => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
        return { width: text.length * 8, height: 18 };
    }

    context.font = font;
    const metrics = context.measureText(text);

    return {
        width: metrics.width + horizontalPadding * 2,
        height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + verticalPadding * 2
    };
};
