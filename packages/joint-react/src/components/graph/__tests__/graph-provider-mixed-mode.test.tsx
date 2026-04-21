/* eslint-disable sonarjs/no-identical-functions */
import React, { useState } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { GraphProvider } from '../graph-provider';
import { useElements, useLinks } from '../../../hooks';
import type { ElementRecord, LinkRecord } from '../../../types/data-types';

const INITIAL_ELEMENT_E1: ElementRecord = { size: { width: 10, height: 10 } };
const INITIAL_ELEMENT_E2: ElementRecord = { size: { width: 20, height: 20 } };
const INITIAL_ELEMENTS_E1E2: Record<string, ElementRecord> = {
  e1: { size: { width: 10, height: 10 } },
  e2: { size: { width: 10, height: 10 } },
};
const INITIAL_LINKS_L1: Record<string, LinkRecord> = { l1: { source: 'e1', target: 'e1' } };
const LINK_L1: LinkRecord = { source: 'e1', target: 'e2' };

describe('GraphProvider mixed mode', () => {
  it('controlled elements + uncontrolled links: links survive an elements update', async () => {
    let elementCount = 0;
    let linkCount = 0;
    function Probe() {
      elementCount = useElements((items) => items.size);
      linkCount = useLinks((items) => items.size);
      return null;
    }

    let externalSetElements!: (next: Record<string, ElementRecord>) => void;
    function App() {
      const [elements, setElements] = useState<Record<string, ElementRecord>>({
        e1: INITIAL_ELEMENT_E1,
      });
      externalSetElements = setElements;
      return (
        <GraphProvider
          elements={elements}
          onElementsChange={setElements}
          initialLinks={INITIAL_LINKS_L1}
        >
          <Probe />
        </GraphProvider>
      );
    }

    render(<App />);
    await waitFor(() => expect(elementCount).toBe(1));
    expect(linkCount).toBe(1);

    act(() => {
      externalSetElements({
        e1: INITIAL_ELEMENT_E1,
        e2: INITIAL_ELEMENT_E2,
      });
    });

    await waitFor(() => expect(elementCount).toBe(2));
    expect(linkCount).toBe(1);
  });

  it('uncontrolled elements + controlled links: elements survive a links update', async () => {
    let elementCount = 0;
    let linkCount = 0;
    function Probe() {
      elementCount = useElements((items) => items.size);
      linkCount = useLinks((items) => items.size);
      return null;
    }

    let externalSetLinks!: (next: Record<string, LinkRecord>) => void;
    function App() {
      const [links, setLinks] = useState<Record<string, LinkRecord>>({});
      externalSetLinks = setLinks;
      return (
        <GraphProvider
          initialElements={INITIAL_ELEMENTS_E1E2}
          links={links}
          onLinksChange={setLinks}
        >
          <Probe />
        </GraphProvider>
      );
    }

    render(<App />);
    await waitFor(() => expect(elementCount).toBe(2));
    expect(linkCount).toBe(0);

    act(() => {
      externalSetLinks({ l1: LINK_L1 });
    });

    await waitFor(() => expect(linkCount).toBe(1));
    expect(elementCount).toBe(2);
  });
});
