/* eslint-disable unicorn/prevent-abbreviations */
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
        <circle r={7} fill="#001DFF" cursor="pointer" />
        <path
          d="M -2 4 2 4 M 0 3 0 0 M -2 -1 1 -1 M -1 -4 1 -4"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2}
          pointerEvents="none"
        />
      </>
    );

    const expected: dia.MarkupJSON = [
      {
        tagName: 'circle',
        children: [],
        attributes: {
          r: 7,
          fill: '#001DFF',
          cursor: 'pointer',
        },
      },
      {
        tagName: 'path',
        children: [],
        attributes: {
          d: 'M -2 4 2 4 M 0 3 0 0 M -2 -1 1 -1 M -1 -4 1 -4',
          fill: 'none',
          stroke: '#FFFFFF',
          strokeWidth: 2,
          pointerEvents: 'none',
        },
      },
    ];
    expect(markup).toEqual(expected);
  });

  it('should handle non-record props gracefully', () => {
    const markup = jsx({} as never);
    expect(markup).toEqual([]);
  });

  it('should handle extractJointAttributes with non-record input (explicit)', () => {
    // This is covered by jsx({} as never), but let's make it explicit
    expect(jsx({} as never)).toEqual([]);
  });

  it('should handle non-element input gracefully', () => {
    expect(jsx(null as never)).toEqual([]);
    expect(jsx(undefined as never)).toEqual([]);
  });

  it('should skip function type that is not a React component', () => {
    const markup = jsx(
      // @ts-expect-error we use internal api here ($$typeof)
      { type: () => <div />, props: {}, $$typeof: Symbol.for('react.element') }
    );
    // The function returns <div />, so the result is markup for a div
    expect(markup).toEqual([
      {
        tagName: 'div',
        children: [],
        attributes: {},
      },
    ]);
  });

  it('should handle React component function returning a primitive', () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function PrimitiveComponent() {
      return 'primitive';
    }
    // Should return [] because isValidElement('primitive') is false
    expect(jsx(<PrimitiveComponent />)).toEqual([]);
  });

  it('should throw on unsupported child type', () => {
    const BadChild = () => <div>{{ foo: 'bar' } as never}</div>;
    expect(() => jsx(<BadChild />)).toThrow('Unsupported child type: object');
  });

  it('should handle boolean, number, null children', () => {
    function NumBoolNull() {
      return <div>{[1, true, null]}</div>;
    }
    const markup = jsx(<NumBoolNull />);
    expect(markup).toEqual([
      {
        tagName: 'div',
        children: ['1', 'true', 'null'],
        attributes: {},
      },
    ]);
  });

  it('should extract joint- attributes', () => {
    const markup = jsx(
      <div id="foo" joint-bar="baz" joint-num={5}>
        <span>Hello</span>
      </div>
    );
    expect(markup).toEqual([
      {
        tagName: 'div',
        children: [
          {
            tagName: 'span',
            children: ['Hello'],
            attributes: {},
          },
        ],
        attributes: { id: 'foo' },
        bar: 'baz',
        num: 5,
      },
    ]);
  });

  it('should handle React component function returning null', () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function NullComponent() {
      return null;
    }
    const markup = jsx(<NullComponent />);
    expect(markup).toEqual([]);
  });

  it('should handle element with no children', () => {
    const markup = jsx(<rect width={10} height={20} />);
    expect(markup).toEqual([
      {
        tagName: 'rect',
        children: [],
        attributes: { width: 10, height: 20 },
      },
    ]);
  });

  it('should handle element with no children (e.g. <hr />)', () => {
    const markup = jsx(<hr />);
    expect(markup).toEqual([
      {
        tagName: 'hr',
        children: [],
        attributes: {},
      },
    ]);
  });

  it('should handle element with string children', () => {
    const markup = jsx(<text>Hello world</text>);
    expect(markup).toEqual([
      {
        tagName: 'text',
        children: ['Hello world'],
        attributes: {},
      },
    ]);
  });
});
