import type { dia } from '@joint/core';
import { jsx } from '../jsx-to-markup';
import type { PropsWithChildren } from 'react';

describe('jsx-to-markup', () => {
  it('should convert div with span', () => {
    const markup = jsx(
      <div id="1">
        <span>Hello</span>
      </div>
    );
    const expected: dia.MarkupJSON = [
      {
        tagName: 'div',
        children: [
          {
            tagName: 'span',
            children: ['Hello'],
            attributes: {},
          },
        ],
        attributes: {
          id: '1',
        },
      },
    ];
    expect(markup).toEqual(expected);
  });
  it('should convert svg', () => {
    const markup = jsx(
      <svg>
        <circle cx={50} cy={50} r={50} />
      </svg>
    );
    const expected: dia.MarkupJSON = [
      {
        tagName: 'svg',
        children: [
          {
            tagName: 'circle',
            children: [],
            attributes: { cx: 50, cy: 50, r: 50 },
          },
        ],
        attributes: {},
      },
    ];
    expect(markup).toEqual(expected);
  });
  it('should convert with multiple children', () => {
    const markup = jsx(
      <svg>
        <circle cx={51} cy={51} r={51} />
        <circle cx={52} cy={52} r={52} />
        <circle cx={53} cy={53} r={53} />
      </svg>
    );

    const expected: dia.MarkupJSON = [
      {
        tagName: 'svg',
        children: [
          {
            tagName: 'circle',
            children: [],
            attributes: { cx: 51, cy: 51, r: 51 },
          },
          {
            tagName: 'circle',
            children: [],
            attributes: { cx: 52, cy: 52, r: 52 },
          },

          {
            tagName: 'circle',
            children: [],
            attributes: { cx: 53, cy: 53, r: 53 },
          },
        ],
        attributes: {},
      },
    ];
    expect(markup).toEqual(expected);
  });
  it('should convert with custom component and html children', () => {
    function CustomComponent(props: Readonly<PropsWithChildren>) {
      return <div>{props.children}</div>;
    }
    const markup = jsx(
      <CustomComponent>
        <span>Hello</span>
      </CustomComponent>
    );
    const expected: dia.MarkupJSON = [
      {
        tagName: 'div',
        children: [
          {
            tagName: 'span',
            children: ['Hello'],
            attributes: {},
          },
        ],
        attributes: {},
      },
    ];
    expect(markup).toEqual(expected);
  });
  it('should convert nested props drilling', () => {
    function CustomComponent(props: Readonly<PropsWithChildren<{ id: string }>>) {
      return (
        <div id={props.id}>
          {props.children}
          <span id={props.id}>{props.id}</span>
        </div>
      );
    }
    const markup = jsx(
      <CustomComponent id="1">
        <span>Hello</span>
      </CustomComponent>
    );
    const expected: dia.MarkupJSON = [
      {
        tagName: 'div',
        children: [
          {
            tagName: 'span',
            children: ['Hello'],
            attributes: {},
          },
          {
            tagName: 'span',
            children: ['1'],
            attributes: {
              id: '1',
            },
          },
        ],
        attributes: {
          id: '1',
        },
      },
    ];
    expect(markup).toEqual(expected);
  });
  it('should convert with fragment', () => {
    const markup = jsx(
      <>
        <circle joint-selector="button" r={7} fill="#001DFF" cursor="pointer" />
        <path
          joint-selector="icon"
          d="M -2 4 2 4 M 0 3 0 0 M -2 -1 1 -1 M -1 -4 1 -4"
          fill="none"
          stroke="#FFFFFF"
          stroke-width={2}
          pointer-events="none"
        />
      </>
    );

    const expected: dia.MarkupJSON = [
      {
        tagName: 'circle',
        children: [],
        attributes: {
          'joint-selector': 'button',
          r: 7,
          fill: '#001DFF',
          cursor: 'pointer',
        },
      },
      {
        tagName: 'path',
        children: [],
        attributes: {
          'joint-selector': 'icon',
          d: 'M -2 4 2 4 M 0 3 0 0 M -2 -1 1 -1 M -1 -4 1 -4',
          fill: 'none',
          stroke: '#FFFFFF',
          'stroke-width': 2,
          'pointer-events': 'none',
        },
      },
    ];
    expect(markup).toEqual(expected);
  });
});
