import React from 'react';

export interface MarkerProps {
  readonly color: string;
  readonly strokeWidth?: string;
  readonly strokeLinejoin?: 'inherit' | 'round' | 'bevel' | 'miter';
}

export interface LinkArrowMarker {
  readonly name: string;
  readonly component: (props: MarkerProps) => React.JSX.Element;
}

/**
 * Predefined arrow markers for links.
 * Use these with BaseLink's startMarker and endMarker props.
 * @group Components
 * @category Link
 */
export const LINK_ARROWS = {
  arrow: {
    name: 'arrow',
    component: (props: MarkerProps) => (
      <path
        d="M 0 0 L 12 -4 L 5 0 L 12 4 z"
        fill={props.color}
        strokeWidth={props.strokeWidth ?? '2'}
      />
    ),
  },
  'arrow-rounded': {
    name: 'arrow-rounded',
    component: (props: MarkerProps) => (
      <path
        d="M 0 0 L 12 -4 L 5 0 L 12 4 z"
        fill={props.color}
        strokeWidth={props.strokeWidth ?? '2'}
        strokeLinejoin={props.strokeLinejoin ?? 'round'}
      />
    ),
  },
  triangle: {
    name: 'triangle',
    component: (props: MarkerProps) => (
      <path d="M 0 0 L 8 -4 L 8 4 z" strokeWidth={props.strokeWidth ?? '2'} fill={props.color} />
    ),
  },
  'triangle-open': {
    name: 'triangle-open',
    component: (props: MarkerProps) => (
      <path d="M -2 0 L 15 -4 V 4 z" strokeWidth={props.strokeWidth ?? '1'} fill={props.color} />
    ),
  },
  diamond: {
    name: 'diamond',
    component: (props: MarkerProps) => (
      <path
        d="M 0 0 L 5 -5 L 10 0 L 5 5 z"
        strokeWidth={props.strokeWidth ?? '2'}
        fill={props.color}
      />
    ),
  },
  'diamond-rounded': {
    name: 'diamond-rounded',
    component: (props: MarkerProps) => (
      <path
        d="M 0 0 L 5 -5 L 10 0 L 5 5 z"
        fill={props.color}
        strokeWidth={props.strokeWidth ?? '2'}
        strokeLinejoin={props.strokeLinejoin ?? 'round'}
      />
    ),
  },
  circle: {
    name: 'circle',
    component: (props: MarkerProps) => (
      <circle r="4" fill={props.color} strokeWidth={props.strokeWidth ?? '2'} />
    ),
  },
  'circle-open': {
    name: 'circle-open',
    component: (props: MarkerProps) => (
      <circle r="4" fill="none" strokeWidth={props.strokeWidth ?? '2'} />
    ),
  },
  line: {
    name: 'line',
    component: (props: MarkerProps) => (
      <path d="M 0 -5 V 5" strokeWidth={props.strokeWidth ?? '2'} fill={props.color} />
    ),
  },
  cross: {
    name: 'cross',
    component: (props: MarkerProps) => (
      <path d="M 0 -4 L 10 0 M 0 4 L 10 0" strokeWidth={props.strokeWidth ?? '2'} />
    ),
  },
  none: {
    name: 'none',
    component: () => <g />,
  },
} as const;

/**
 * Arrow marker names that can be used with BaseLink.
 * @group Components
 * @category Link
 */
export type LinkArrowName = keyof typeof LINK_ARROWS;

/**
 * Get an arrow marker by name.
 * @param name - The name of the arrow marker.
 * @returns The arrow marker or undefined if not found.
 * @group Components
 * @category Link
 */
export function getLinkArrow(name: LinkArrowName): LinkArrowMarker | undefined {
  return LINK_ARROWS[name];
}
