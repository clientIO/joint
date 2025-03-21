/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable no-console */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { BG, PRIMARY } from '.storybook/theme';
import { dia, shapes } from '@joint/core';
import {
  GraphProvider,
  HTMLNode,
  Paper,
  ReactElement,
  useElements,
  useGraph,
  useSetCells,
  type RenderElement,
} from '@joint/react';
import type { Meta, StoryObj } from '@storybook/react/*';
import { useCallback, useRef } from 'react';

export type Story = StoryObj<typeof Paper>;
const meta: Meta<typeof Paper> = {
  title: 'Stress/Paper',
  component: Paper,
};

export default meta;

const paperStoryOptions: dia.Paper.Options = {
  width: 400,
  height: 400,
  background: { color: BG },
  gridSize: 2,
};

function createElements(xCount: number, yCount: number) {
  const elements = [];
  const ELEMENT_SIZE = 50;
  const MARGIN = 2;
  for (let x = 0; x < xCount; x++) {
    for (let y = 0; y < yCount; y++) {
      elements.push(
        new ReactElement({
          id: `${x}-${y}`,
          position: { x: x * (ELEMENT_SIZE + MARGIN), y: y * (ELEMENT_SIZE + MARGIN) },
          size: { width: ELEMENT_SIZE, height: ELEMENT_SIZE },
          attrs: {
            label: { text: `${x}-${y}` },
          },
        })
      );
      // add a link to the previous element
      if (x > 0) {
        elements.push(
          new shapes.standard.Link({
            id: `${x - 1}-${y}-${x}-${y}`,
            source: { id: `${x - 1}-${y}` },
            target: { id: `${x}-${y}` },
            attrs: {
              line: {
                stroke: PRIMARY,
                strokeDasharray: '5,5',
              },
            },
          })
        );
        // add link to next element
        if (y > 0) {
          elements.push(
            new shapes.standard.Link({
              id: `${x}-${y - 1}-${x}-${y}`,
              source: { id: `${x}-${y - 1}` },
              target: { id: `${x}-${y}` },
              attrs: {
                line: {
                  stroke: PRIMARY,
                  strokeDasharray: '5,5',
                },
              },
            })
          );
        }
      }
    }
  }
  return elements;
}

const WIDTH_ITEMS = 15;
const HEIGHT_ITEMS = 30;

function RandomChange() {
  const elementsSize = useElements((items) => items.size);
  const setCells = useSetCells();
  const graph = useGraph();
  return (
    <>
      <button
        onClick={() => {
          console.time('Random move');
          setCells((previousCells) =>
            previousCells.map((cell) => {
              if (cell instanceof ReactElement) {
                cell.set({
                  position: { x: Math.random() * 1000, y: Math.random() * 1000 },
                });
                return cell;
              }
              return cell;
            })
          );
          console.timeEnd('Random move');
        }}
      >
        Random move {elementsSize} elements - set With hook
      </button>
      <button
        onClick={() => {
          // graph.startBatch('Random move')
          const elements = graph.getElements();
          console.time('Random move');
          for (const element of elements) {
            if (element instanceof ReactElement) {
              element.set({
                position: { x: Math.random() * 1000, y: Math.random() * 1000 },
              });
            }
          }
          console.timeEnd('Random move');
          // graph.stopBatch('Random move')
        }}
      >
        Random move {elementsSize} elements - set With Graph
      </button>
    </>
  );
}

function createGraph() {
  const graph = new dia.Graph({}, { cellNamespace: { ...shapes, ReactElement } });
  graph.addCells(createElements(WIDTH_ITEMS, HEIGHT_ITEMS));
  return graph;
}

export const WithReactElements: Story = {
  args: {
    style: { border: '1px solid #ccc' },
  },
  render: () => {
    console.log('re-render WithHooksAPI');
    const graph = useRef(createGraph()).current;

    console.log('re-render WithHooksAPI');

    const renderElement: RenderElement = useCallback((element) => {
      return (
        <HTMLNode
          style={{
            fontSize: 12,
            background: PRIMARY,
            overflow: 'hidden',
            width: element.width,
            height: element.height,
          }}
          onClick={() => console.log('Click from React')}
        >
          {JSON.stringify(element.x)}
        </HTMLNode>
      );
    }, []);
    return (
      <GraphProvider graph={graph}>
        <RandomChange />
        <div style={{ display: 'flex', flex: 1 }}>
          <Paper {...paperStoryOptions} renderElement={renderElement} />
        </div>
      </GraphProvider>
    );
  },
};
