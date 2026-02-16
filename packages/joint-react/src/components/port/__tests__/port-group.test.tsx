/* eslint-disable unicorn/consistent-function-scoping */
import { render, waitFor } from '@testing-library/react';
import { getTestGraph, paperRenderElementWrapper } from '../../../utils/test-wrappers';
import { PortGroup } from '../port-group';

describe('PortGroup cleanup', () => {
  const getTestWrapper = () => {
    const graph = getTestGraph();
    return {
      graph,
      wrapper: paperRenderElementWrapper({
        graphProviderProps: {
          graph,
          elements: {
            'element-1': {
              x: 0,
              y: 0,
              width: 100,
              height: 100,
            },
          },
        },
      }),
    };
  };

  it('should add port group on mount', async () => {
    const { graph, wrapper } = getTestWrapper();
    render(<PortGroup id="test-group" position="absolute" />, { wrapper });

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) {
        throw new Error('Element not found');
      }
      const groups = element.prop('ports/groups') ?? {};
      expect(groups['test-group']).toBeDefined();
    });
  });

  it('should remove port group on unmount', async () => {
    const { graph, wrapper } = getTestWrapper();
    const { unmount } = render(<PortGroup id="test-group" position="absolute" />, { wrapper });

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) {
        throw new Error('Element not found');
      }
      const groups = element.prop('ports/groups') ?? {};
      expect(groups['test-group']).toBeDefined();
    });

    unmount();

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) {
        throw new Error('Element not found');
      }
      const groups = element.prop('ports/groups') ?? {};
      expect(groups['test-group']).toBeUndefined();
    });
  });

  it('should remove multiple port groups on unmount', async () => {
    const { graph, wrapper } = getTestWrapper();
    const { unmount } = render(
      <>
        <PortGroup id="group-1" position="absolute" />
        <PortGroup id="group-2" position="absolute" />
      </>,
      { wrapper }
    );

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) {
        throw new Error('Element not found');
      }
      const groups = element.prop('ports/groups') ?? {};
      expect(groups['group-1']).toBeDefined();
      expect(groups['group-2']).toBeDefined();
    });

    unmount();

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) {
        throw new Error('Element not found');
      }
      const groups = element.prop('ports/groups') ?? {};
      expect(groups['group-1']).toBeUndefined();
      expect(groups['group-2']).toBeUndefined();
    });
  });

  it('should update port group props without error when props change', async () => {
    const { graph, wrapper } = getTestWrapper();

    const TestComponent = ({ width }: { readonly width: number }) => (
      <PortGroup id="test-group" position="absolute" width={width} />
    );

    const { rerender } = render(<TestComponent width={100} />, { wrapper });

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) throw new Error('Element not found');
      const groups = element.prop('ports/groups') ?? {};
      expect(groups['test-group']).toBeDefined();
    });

    // Changing props should NOT remove and re-add the group (no error)
    rerender(<TestComponent width={200} />);

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) throw new Error('Element not found');
      const groups = element.prop('ports/groups') ?? {};
      expect(groups['test-group']).toBeDefined();
    });
  });

  it('should remove port group on unmount after props have been changed', async () => {
    const { graph, wrapper } = getTestWrapper();

    const TestComponent = ({ width }: { readonly width: number }) => (
      <PortGroup id="test-group" position="absolute" width={width} />
    );

    const { rerender, unmount } = render(<TestComponent width={100} />, { wrapper });

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) throw new Error('Element not found');
      const groups = element.prop('ports/groups') ?? {};
      expect(groups['test-group']).toBeDefined();
    });

    // Change props first
    rerender(<TestComponent width={200} />);

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) throw new Error('Element not found');
      const groups = element.prop('ports/groups') ?? {};
      expect(groups['test-group']).toBeDefined();
    });

    // Then unmount - group should be cleaned up
    unmount();

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) throw new Error('Element not found');
      const groups = element.prop('ports/groups') ?? {};
      expect(groups['test-group']).toBeUndefined();
    });
  });

  it('should only remove unmounted group, keeping others', async () => {
    const { graph, wrapper } = getTestWrapper();

    const TestComponent = ({ showSecondGroup }: { showSecondGroup: boolean }) => (
      <>
        <PortGroup id="group-1" position="absolute" />
        {showSecondGroup && <PortGroup id="group-2" position="absolute" />}
      </>
    );

    const { rerender } = render(<TestComponent showSecondGroup={true} />, { wrapper });

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) {
        throw new Error('Element not found');
      }
      const groups = element.prop('ports/groups') ?? {};
      expect(groups['group-1']).toBeDefined();
      expect(groups['group-2']).toBeDefined();
    });

    // Remove only the second group
    rerender(<TestComponent showSecondGroup={false} />);

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) {
        throw new Error('Element not found');
      }
      const groups = element.prop('ports/groups') ?? {};
      expect(groups['group-1']).toBeDefined();
      expect(groups['group-2']).toBeUndefined();
    });
  });
});
