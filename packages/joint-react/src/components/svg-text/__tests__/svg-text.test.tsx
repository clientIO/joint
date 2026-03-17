/* eslint-disable react-perf/jsx-no-new-object-as-prop */
jest.mock('@joint/core', () => {
  const actual = jest.requireActual('@joint/core');
  return {
    ...actual,
    util: {
      ...actual.util,
      breakText: jest.fn(actual.util.breakText),
    },
  };
});

import { paperRenderElementWrapper } from '../../../utils/test-wrappers';
import { SVGText } from '../svg-text';
import { util } from '@joint/core';
import { render, waitFor } from '@testing-library/react';

const UPPERCASE_STYLE = { textTransform: 'uppercase' } as const;

describe('SVGText', () => {
  it('renders with minimal props', () => {
    render(<SVGText>hello</SVGText>, { wrapper: paperRenderElementWrapper({}) });
  });

  it('renders with width and textWrap', () => {
    render(
      <SVGText width={100} textWrap>
        hello world
      </SVGText>,
      { wrapper: paperRenderElementWrapper({}) }
    );
  });

  it('renders with height and textWrap options', () => {
    render(
       
      <SVGText width={100} height={40} textWrap={{ ellipsis: true, maxLineCount: 2 }}>
        hello world hello world hello world
      </SVGText>,
      { wrapper: paperRenderElementWrapper({}) }
    );
  });

  it('renders with all supported props', () => {
    render(
      <SVGText
        width={120}
        height={50}
        fill="red"
        x={10}
        textVerticalAnchor="middle"
        lineHeight={1.5}
        displayEmpty
        eol="|"
        textWrap
      >
        test all props
      </SVGText>,
      { wrapper: paperRenderElementWrapper({}) }
    );
  });

  it('passes text styles to util.breakText', () => {
    render(
      <SVGText
        width={120}
        textWrap
        lineHeight={1.5}
        fontSize={14}
        fontFamily="monospace"
        fontWeight={600}
        letterSpacing={2}
        style={UPPERCASE_STYLE}
      >
        styled text
      </SVGText>,
      {
        wrapper: paperRenderElementWrapper({
          graphProviderProps: {
            elements: {
              '1': {
                width: 120,
                height: 40,
              },
            },
          },
        }),
      }
    );

    return waitFor(() => {
      expect(util.breakText).toHaveBeenCalledWith(
        'styled text',
        { width: 120, height: undefined },
        {
          'font-size': 14,
          'font-family': 'monospace',
          'font-weight': 600,
          'letter-spacing': 2,
          'text-transform': 'uppercase',
          'line-height': 1.5,
        },
        {}
      );
    });
  });
});
