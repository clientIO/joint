/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error we mocking this import
import { __mocks as jointMocks } from '@joint/core';
import { handlePaperEvents } from '../handle-paper-events';

// ---- Mock @joint/core so we can spy on mvc.Listener.listenTo/stopListening ----
jest.mock('@joint/core', () => {
  // In your monorepo this should exist; we extend it with a mock Listener
  const actual = jest.requireActual('@joint/core');

  const listenTo = jest.fn();
  const stopListening = jest.fn();
  const Listener = jest.fn().mockImplementation(() => ({
    listenTo,
    stopListening,
  }));

  return {
    ...actual,
    mvc: { Listener },
    __mocks: { listenTo, stopListening, Listener },
  };
});

// All supported PaperEvents -> underlying JointJS event names.
// Keep this list in sync with ../handle-paper-events.ts
const CASES: Array<{ name: string; jointEvent: string }> = [
  // --- render ---
  { name: 'onRenderDone', jointEvent: 'render:done' },

  // --- pointer click ---
  { name: 'onCellPointerClick', jointEvent: 'cell:pointerclick' },
  { name: 'onElementPointerClick', jointEvent: 'element:pointerclick' },
  { name: 'onLinkPointerClick', jointEvent: 'link:pointerclick' },
  { name: 'onBlankPointerClick', jointEvent: 'blank:pointerclick' },

  // --- dblclick ---
  { name: 'onCellPointerDblClick', jointEvent: 'cell:pointerdblclick' },
  { name: 'onElementPointerDblClick', jointEvent: 'element:pointerdblclick' },
  { name: 'onLinkPointerDblClick', jointEvent: 'link:pointerdblclick' },
  { name: 'onBlankPointerDblClick', jointEvent: 'blank:pointerdblclick' },

  // --- contextmenu ---
  { name: 'onCellContextMenu', jointEvent: 'cell:contextmenu' },
  { name: 'onElementContextMenu', jointEvent: 'element:contextmenu' },
  { name: 'onLinkContextMenu', jointEvent: 'link:contextmenu' },
  { name: 'onBlankContextMenu', jointEvent: 'blank:contextmenu' },

  // --- pointer down/move/up ---
  { name: 'onCellPointerDown', jointEvent: 'cell:pointerdown' },
  { name: 'onElementPointerDown', jointEvent: 'element:pointerdown' },
  { name: 'onLinkPointerDown', jointEvent: 'link:pointerdown' },
  { name: 'onBlankPointerDown', jointEvent: 'blank:pointerdown' },

  { name: 'onCellPointerMove', jointEvent: 'cell:pointermove' },
  { name: 'onElementPointerMove', jointEvent: 'element:pointermove' },
  { name: 'onLinkPointerMove', jointEvent: 'link:pointermove' },
  { name: 'onBlankPointerMove', jointEvent: 'blank:pointermove' },

  { name: 'onCellPointerUp', jointEvent: 'cell:pointerup' },
  { name: 'onElementPointerUp', jointEvent: 'element:pointerup' },
  { name: 'onLinkPointerUp', jointEvent: 'link:pointerup' },
  { name: 'onBlankPointerUp', jointEvent: 'blank:pointerup' },

  // --- mouse over/out ---
  { name: 'onCellMouseOver', jointEvent: 'cell:mouseover' },
  { name: 'onElementMouseOver', jointEvent: 'element:mouseover' },
  { name: 'onLinkMouseOver', jointEvent: 'link:mouseover' },
  { name: 'onBlankMouseOver', jointEvent: 'blank:mouseover' },

  { name: 'onCellMouseOut', jointEvent: 'cell:mouseout' },
  { name: 'onElementMouseOut', jointEvent: 'element:mouseout' },
  { name: 'onLinkMouseOut', jointEvent: 'link:mouseout' },
  { name: 'onBlankMouseOut', jointEvent: 'blank:mouseout' },

  // --- mouse enter/leave ---
  { name: 'onCellMouseEnter', jointEvent: 'cell:mouseenter' },
  { name: 'onElementMouseEnter', jointEvent: 'element:mouseenter' },
  { name: 'onLinkMouseEnter', jointEvent: 'link:mouseenter' },
  { name: 'onBlankMouseEnter', jointEvent: 'blank:mouseenter' },

  { name: 'onCellMouseLeave', jointEvent: 'cell:mouseleave' },
  { name: 'onElementMouseLeave', jointEvent: 'element:mouseleave' },
  { name: 'onLinkMouseLeave', jointEvent: 'link:mouseleave' },
  { name: 'onBlankMouseLeave', jointEvent: 'blank:mouseleave' },

  // --- mouse wheel ---
  { name: 'onCellMouseWheel', jointEvent: 'cell:mousewheel' },
  { name: 'onElementMouseWheel', jointEvent: 'element:mousewheel' },
  { name: 'onLinkMouseWheel', jointEvent: 'link:mousewheel' },
  { name: 'onBlankMouseWheel', jointEvent: 'blank:mousewheel' },

  // --- paper gestures ---
  { name: 'onPan', jointEvent: 'paper:pan' },
  { name: 'onPinch', jointEvent: 'paper:pinch' },

  // --- paper mouse enter/leave ---
  { name: 'onPaperMouseEnter', jointEvent: 'paper:mouseenter' },
  { name: 'onPaperMouseLeave', jointEvent: 'paper:mouseleave' },

  // --- magnet events ---
  { name: 'onElementMagnetPointerClick', jointEvent: 'element:magnet:pointerclick' },
  { name: 'onElementMagnetPointerDblClick', jointEvent: 'element:magnet:pointerdblclick' },
  { name: 'onElementMagnetContextMenu', jointEvent: 'element:magnet:contextmenu' },

  // --- highlight events ---
  { name: 'onCellHighlight', jointEvent: 'cell:highlight' },
  { name: 'onCellUnhighlight', jointEvent: 'cell:unhighlight' },
  { name: 'onCellHighlightInvalid', jointEvent: 'cell:highlight:invalid' },

  // --- link connection events ---
  { name: 'onLinkConnect', jointEvent: 'link:connect' },
  { name: 'onLinkDisconnect', jointEvent: 'link:disconnect' },
  { name: 'onLinkSnapConnect', jointEvent: 'link:snap:connect' },
  { name: 'onLinkSnapDisconnect', jointEvent: 'link:snap:disconnect' },

  // --- transform events ---
  { name: 'onTranslate', jointEvent: 'translate' },
  { name: 'onScale', jointEvent: 'scale' },
  { name: 'onResize', jointEvent: 'resize' },
  { name: 'onTransform', jointEvent: 'transform' },
  { name: 'onCustomEvent', jointEvent: 'custom' },
];

describe('handlePaperEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an mvc.Listener controller', () => {
    const paper: any = {};
    const events: any = { onRenderDone: jest.fn() };

    handlePaperEvents(paper, events);

    expect(jointMocks.Listener).toHaveBeenCalledTimes(1);
  });

  it('registers listeners for every provided PaperEvent', () => {
    const paper: any = {};
    const events: Record<string, jest.Mock> = {};

    // Provide all events
    for (const c of CASES) events[c.name] = jest.fn();

    handlePaperEvents(paper, events as any);

    // One listenTo per provided event
    expect(jointMocks.listenTo).toHaveBeenCalledTimes(CASES.length);

    // Each call matches [paper, jointEvent, function]
    for (const { jointEvent } of CASES) {
      expect(jointMocks.listenTo).toHaveBeenCalledWith(paper, jointEvent, expect.any(Function));
    }
  });

  it('registers only for specified events and skips missing ones', () => {
    const paper: any = {};
    const events: any = {
      onRenderDone: jest.fn(),
      onCellPointerClick: jest.fn(),
    };

    handlePaperEvents(paper, events);

    expect(jointMocks.listenTo).toHaveBeenCalledTimes(2);
    expect(jointMocks.listenTo).toHaveBeenCalledWith(paper, 'render:done', expect.any(Function));
    expect(jointMocks.listenTo).toHaveBeenCalledWith(
      paper,
      'cell:pointerclick',
      expect.any(Function)
    );
  });

  it('ignores unknown event keys gracefully', () => {
    const paper: any = {};
    const events: any = {
      onRenderDone: jest.fn(),
      notARealEvent: jest.fn(),
    };

    handlePaperEvents(paper, events);

    // Only real event was registered
    expect(jointMocks.listenTo).toHaveBeenCalledTimes(1);
    expect(jointMocks.listenTo).toHaveBeenCalledWith(paper, 'render:done', expect.any(Function));
  });

  it('returns a disposer that calls stopListening()', () => {
    const paper: any = {};
    const events: any = { onRenderDone: jest.fn() };

    const dispose = handlePaperEvents(paper, events);
    expect(jointMocks.stopListening).not.toHaveBeenCalled();

    dispose();

    expect(jointMocks.stopListening).toHaveBeenCalledTimes(1);
  });
});
