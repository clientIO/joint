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

import React from 'react';
import { paperRenderElementWrapper } from '../../../utils/test-wrappers';
import { SVGText } from '../svg-text';
import { util } from '@joint/core';
import { render, waitFor } from '@testing-library/react';
import { ELEMENT_MODEL_TYPE } from '../../../models/element-model';

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

  it('falls back to style fallbacks when explicit font props are undefined', async () => {
    render(
      <SVGText width={120} textWrap style={{ fontWeight: 700, fontFamily: 'serif', fontSize: 12, letterSpacing: 1, lineHeight: 1.2 }}>
        styled fallback
      </SVGText>,
      {
        wrapper: paperRenderElementWrapper({
          graphProviderProps: {
            initialCells: [
              {
                id: '1',
                type: ELEMENT_MODEL_TYPE,
                size: { width: 120, height: 40 },
              },
            ],
          },
        }),
      }
    );
    await waitFor(() => {
      expect(util.breakText).toHaveBeenCalledWith(
        'styled fallback',
        { width: 120, height: undefined },
        expect.objectContaining({
          'font-weight': 700,
          'font-family': 'serif',
          'font-size': 12,
          'letter-spacing': 1,
          'line-height': 1.2,
        }),
        {}
      );
    });
  });

  it('uses the cell size from the graph when width prop is undefined', async () => {
    render(
      <SVGText textWrap>
        wrap-from-cell-size
      </SVGText>,
      {
        wrapper: paperRenderElementWrapper({
          graphProviderProps: {
            initialCells: [
              {
                id: '1',
                type: ELEMENT_MODEL_TYPE,
                size: { width: 87, height: 33 },
              },
            ],
          },
        }),
      }
    );
    await waitFor(() => {
      expect(util.breakText).toHaveBeenCalledWith(
        'wrap-from-cell-size',
        { width: 87, height: undefined },
        expect.any(Object),
        {}
      );
    });
  });

  it('forwards a non-numeric width prop straight to util.breakText (string-typed width branch)', async () => {
    render(
      <SVGText width={'50%' as unknown as number} textWrap>
        non-num width
      </SVGText>,
      {
        wrapper: paperRenderElementWrapper({
          graphProviderProps: {
            initialCells: [
              {
                id: '1',
                type: ELEMENT_MODEL_TYPE,
                size: { width: 120, height: 40 },
              },
            ],
          },
        }),
      }
    );
    await waitFor(() => {
      expect(util.breakText).toHaveBeenCalledWith(
        'non-num width',
        expect.objectContaining({ width: '50%' }),
        expect.any(Object),
        {}
      );
    });
  });

  it('clamps a negative numeric width to zero (Math.max branch)', async () => {
    render(
      <SVGText width={-10} textWrap>
        neg width
      </SVGText>,
      {
        wrapper: paperRenderElementWrapper({
          graphProviderProps: {
            initialCells: [
              {
                id: '1',
                type: ELEMENT_MODEL_TYPE,
                size: { width: 120, height: 40 },
              },
            ],
          },
        }),
      }
    );
    await waitFor(() => {
      expect(util.breakText).toHaveBeenCalledWith(
        'neg width',
        { width: 0, height: undefined },
        expect.any(Object),
        {}
      );
    });
  });

  it('throws when used outside of renderElement (no CellIdContext)', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<SVGText>orphan</SVGText>)).toThrow(
      /SVGText must be used inside renderElement/
    );
    consoleError.mockRestore();
  });

  it('throws when children is not a string', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const captured: Error[] = [];
    const errorListener = (event: ErrorEvent) => {
      if (event.error instanceof Error) {
        captured.push(event.error);
      }
      event.preventDefault();
    };
    globalThis.addEventListener('error', errorListener);
    render(
      <SVGText>
        {/* non-string child */}
        {123 as unknown as string}
      </SVGText>,
      {
        wrapper: paperRenderElementWrapper({
          graphProviderProps: {
            initialCells: [
              {
                id: '1',
                type: ELEMENT_MODEL_TYPE,
                size: { width: 50, height: 50 },
              },
            ],
          },
        }),
      }
    );
    await waitFor(() => {
      const messages = [
        ...captured.map((error) => error.message),
        ...consoleError.mock.calls.flat().map(String),
      ].join('\n');
      expect(messages).toMatch(/SVGText children must be a string/);
    });
    globalThis.removeEventListener('error', errorListener);
    consoleError.mockRestore();
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
            initialCells: [
              {
                id: '1',
                type: ELEMENT_MODEL_TYPE,
                size: { width: 120, height: 40 },
              },
            ],
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
