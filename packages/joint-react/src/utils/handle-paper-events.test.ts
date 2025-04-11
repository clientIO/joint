/* eslint-disable @typescript-eslint/no-explicit-any */
import { handleEvent } from './handle-paper-events';
import type { dia } from '@joint/core';
import type { PaperEvents, PaperEventType } from '../types/event.types';

describe('handle-paper-events', () => {
  let mockPaper: dia.Paper;
  let mockEvents: PaperEvents;

  beforeEach(() => {
    mockPaper = {} as dia.Paper;
    mockEvents = {};
  });

  const eventTestCases: Array<{
    type: PaperEventType;
    args: unknown[];
    handler: keyof PaperEvents;
    expected: Record<string, unknown>;
  }> = [
    {
      type: 'cell:pointerclick',
      args: [{}, {}, 10, 20],
      handler: 'onCellPointerClick',
      expected: { cellView: {}, event: {}, x: 10, y: 20 },
    },
    {
      type: 'element:pointerclick',
      args: [{}, {}, 15, 25],
      handler: 'onElementPointerClick',
      expected: { elementView: {}, event: {}, x: 15, y: 25 },
    },
    {
      type: 'link:pointerclick',
      args: [{}, {}, 30, 40],
      handler: 'onLinkPointerClick',
      expected: { linkView: {}, event: {}, x: 30, y: 40 },
    },
    {
      type: 'blank:pointerclick',
      args: [{}, 50, 60],
      handler: 'onBlankPointerClick',
      expected: { event: {}, x: 50, y: 60 },
    },
    {
      type: 'cell:pointerdblclick',
      args: [{}, {}, 70, 80],
      handler: 'onCellPointerDblClick',
      expected: { cellView: {}, event: {}, x: 70, y: 80 },
    },
    {
      type: 'element:pointerdblclick',
      args: [{}, {}, 90, 100],
      handler: 'onElementPointerDblClick',
      expected: { elementView: {}, event: {}, x: 90, y: 100 },
    },
    {
      type: 'link:pointerdblclick',
      args: [{}, {}, 110, 120],
      handler: 'onLinkPointerDblClick',
      expected: { linkView: {}, event: {}, x: 110, y: 120 },
    },
    {
      type: 'blank:pointerdblclick',
      args: [{}, 130, 140],
      handler: 'onBlankPointerDblClick',
      expected: { event: {}, x: 130, y: 140 },
    },
    {
      type: 'cell:contextmenu',
      args: [{}, {}, 150, 160],
      handler: 'onCellContextMenu',
      expected: { cellView: {}, event: {}, x: 150, y: 160 },
    },
    {
      type: 'element:contextmenu',
      args: [{}, {}, 170, 180],
      handler: 'onElementContextMenu',
      expected: { elementView: {}, event: {}, x: 170, y: 180 },
    },
    {
      type: 'link:contextmenu',
      args: [{}, {}, 190, 200],
      handler: 'onLinkContextMenu',
      expected: { linkView: {}, event: {}, x: 190, y: 200 },
    },
    {
      type: 'blank:contextmenu',
      args: [{}, 210, 220],
      handler: 'onBlankContextMenu',
      expected: { event: {}, x: 210, y: 220 },
    },
    {
      type: 'paper:pan',
      args: [{}, 230, 240],
      handler: 'onPan',
      expected: { event: {}, deltaX: 230, deltaY: 240 },
    },
    {
      type: 'paper:pinch',
      args: [{}, 250, 260, 1.5],
      handler: 'onPinch',
      expected: { event: {}, x: 250, y: 260, scale: 1.5 },
    },
    {
      type: 'element:magnet:pointerclick',
      args: [{}, {}, {}, 270, 280],
      handler: 'onElementMagnetPointerClick',
      expected: { elementView: {}, event: {}, magnetNode: {}, x: 270, y: 280 },
    },
    {
      type: 'element:magnet:pointerdblclick',
      args: [{}, {}, {}, 290, 300],
      handler: 'onElementMagnetPointerDblClick',
      expected: { elementView: {}, event: {}, magnetNode: {}, x: 290, y: 300 },
    },
    {
      type: 'element:magnet:contextmenu',
      args: [{}, {}, {}, 310, 320],
      handler: 'onElementMagnetContextMenu',
      expected: { elementView: {}, event: {}, magnetNode: {}, x: 310, y: 320 },
    },
    {
      type: 'cell:highlight',
      args: [{}, {}, {}],
      handler: 'onCellHighlight',
      expected: { cellView: {}, node: {}, options: {} },
    },
    {
      type: 'cell:unhighlight',
      args: [{}, {}, {}],
      handler: 'onCellUnhighlight',
      expected: { cellView: {}, node: {}, options: {} },
    },
    {
      type: 'cell:highlight:invalid',
      args: [{}, 'highlighterId', {}],
      handler: 'onCellHighlightInvalid',
      expected: { cellView: {}, highlighterId: 'highlighterId', highlighter: {} },
    },
    {
      type: 'link:connect',
      args: [{}, {}, {}, {}, {}],
      handler: 'onLinkConnect',
      expected: { linkView: {}, event: {}, newCellView: {}, newCellViewMagnet: {}, arrowhead: {} },
    },
    {
      type: 'link:disconnect',
      args: [{}, {}, {}, {}, {}],
      handler: 'onLinkDisconnect',
      expected: {
        linkView: {},
        event: {},
        previousCellView: {},
        previousCellViewMagnet: {},
        arrowhead: {},
      },
    },
    {
      type: 'link:snap:connect',
      args: [{}, {}, {}, {}, {}],
      handler: 'onLinkSnapConnect',
      expected: { linkView: {}, event: {}, newCellView: {}, newCellViewMagnet: {}, arrowhead: {} },
    },
    {
      type: 'link:snap:disconnect',
      args: [{}, {}, {}, {}, {}],
      handler: 'onLinkSnapDisconnect',
      expected: {
        linkView: {},
        event: {},
        previousCellView: {},
        previousCellViewMagnet: {},
        arrowhead: {},
      },
    },
    {
      type: 'custom',
      args: ['customEvent', {}, {}, {}],
      handler: 'onCustom',
      expected: { eventName: 'customEvent', args: [{}, {}, {}] },
    },
  ];

  for (const { type, args, handler, expected } of eventTestCases) {
    it(`should call ${handler} for ${type}`, () => {
      const mockHandler = jest.fn();
      (mockEvents as any)[handler] = mockHandler;

      handleEvent(type, mockEvents, mockPaper, ...args);

      expect(mockHandler).toHaveBeenCalledWith({ ...expected, paper: mockPaper });
    });
  }
});
