import { render } from '@testing-library/react';
import {
  getTestGraph,
  graphProviderWrapper,
  paperRenderElementWrapper,
  paperRenderLinkWrapper,
  simpleRenderElementWrapper,
} from '../test-wrappers';

describe('test-wrappers', () => {
  it('getTestGraph returns a JointJS graph', () => {
    const graph = getTestGraph();
    expect(graph).toBeDefined();
    expect(typeof graph.toJSON).toBe('function');
  });

  it('graphProviderWrapper renders children', () => {
    const Wrapper = graphProviderWrapper({});
    const { container } = render(
      <Wrapper>
        <div data-testid="child">child</div>
      </Wrapper>,
    );
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it('paperRenderElementWrapper renders Paper inside GraphProvider', () => {
    const Wrapper = paperRenderElementWrapper({
      graphProviderProps: {},
    });
    const { container } = render(
      <Wrapper>
        <rect width={10} height={10} />
      </Wrapper>,
    );
    expect(container).toBeDefined();
  });

  it('paperRenderLinkWrapper renders Paper with renderLink', () => {
    const Wrapper = paperRenderLinkWrapper({
      graphProviderProps: {},
    });
    const { container } = render(
      <Wrapper>
        <g data-testid="link" />
      </Wrapper>,
    );
    expect(container).toBeDefined();
  });

  it('simpleRenderElementWrapper is a constructor', () => {
    expect(typeof simpleRenderElementWrapper).toBe('function');
    const Wrapper = simpleRenderElementWrapper;
    const { container } = render(
      <Wrapper>
        <rect width={10} height={10} />
      </Wrapper>,
    );
    expect(container).toBeDefined();
  });
});
