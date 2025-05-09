/* eslint-disable sonarjs/deprecation */
import { dia } from '@joint/core';
import { createStore } from '../create-store';
import { waitFor } from '@testing-library/react';

describe('createStore', () => {
  it('should initialize with default options', () => {
    const store = createStore();
    expect(store.graph).toBeDefined();
    expect(store.getElements().size).toBe(0);
    expect(store.getLinks().size).toBe(0);
  });

  it('should initialize with custom graph instance', () => {
    const customGraph = new dia.Graph();
    const store = createStore({ graph: customGraph });
    expect(store.graph).toBe(customGraph);
  });

  it('should add default elements', () => {
    const element = new dia.Element({ id: 'element1', type: 'standard.Rectangle' });
    const link = new dia.Link({ id: 'link1', type: 'standard.Link', source: { id: 'element1' } });
    const store = createStore({
      defaultElements: [element],
      defaultLinks: [link],
    });
    expect(store.getElements().size).toBe(1);
    expect(store.getElement('element1')).toBeDefined();
  });

  it('should throw an error when getting a non-existent element', () => {
    const store = createStore();
    expect(() => store.getElement('nonexistent')).toThrowError(
      'Element with id nonexistent not found'
    );
  });

  it('should throw an error when getting a non-existent link', () => {
    const store = createStore();
    expect(() => store.getLink('nonexistent')).toThrowError('Link with id nonexistent not found');
  });

  it('should notify subscribers on changes', async () => {
    const store = createStore();
    const callback = jest.fn();
    const unsubscribe = store.subscribe(callback);

    const element = new dia.Element({ id: 'element1', type: 'standard.Rectangle' });
    store.graph.addCell(element);

    await waitFor(() => {
      expect(callback).toHaveBeenCalled();
      unsubscribe();
    });
  });

  it('should clean up properly on destroy', () => {
    const store = createStore();
    const unsubscribeSpy = jest.spyOn(store, 'destroy');

    store.destroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(store.graph.getCells().length).toBe(0);
  });

  it('should return undefined for non-existent port elements', () => {
    const store = createStore();
    const retrievedPortElement = store.getPortElement('cell1', 'nonexistent');
    expect(retrievedPortElement).toBeUndefined();
  });
});
