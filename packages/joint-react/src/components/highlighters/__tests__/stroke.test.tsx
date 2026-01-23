import { render } from '@testing-library/react';
import { paperRenderElementWrapper } from '../../../utils/test-wrappers';
import { Stroke } from '../stroke';

describe('Stroke highlighter', () => {
  const wrapper = paperRenderElementWrapper({
    graphProviderProps: {
      elements: [
        {
          id: '1',
          width: 100,
          height: 100,
        },
      ],
    },
    paperProps: {
      renderElement: () => <rect />,
    },
  });

  it('should render without crashing', () => {
    const { container } = render(<Stroke />, { wrapper });

    expect(container).toBeDefined();
  });

  it('should render with children', () => {
    const { container } = render(
      <Stroke>
        <path d="M0,0 L10,10" />
      </Stroke>,
      { wrapper }
    );

    expect(container).toBeDefined();
  });

  it('should render with padding prop', () => {
    const { container } = render(<Stroke padding={10} />, { wrapper });

    expect(container).toBeDefined();
  });

  it('should render with layer prop', () => {
    const { container } = render(<Stroke layer="back" />, { wrapper });

    expect(container).toBeDefined();
  });

  it('should render with rx and ry props', () => {
    const { container } = render(<Stroke rx={5} ry={5} />, { wrapper });

    expect(container).toBeDefined();
  });

  it('should render with useFirstSubpath prop', () => {
    const { container } = render(<Stroke useFirstSubpath />, { wrapper });

    expect(container).toBeDefined();
  });

  it('should render with nonScalingStroke prop', () => {
    const { container } = render(<Stroke nonScalingStroke />, { wrapper });

    expect(container).toBeDefined();
  });

  it('should render with isHidden prop', () => {
    const { container } = render(<Stroke isHidden />, { wrapper });

    expect(container).toBeDefined();
  });

  it('should render with SVG attributes', () => {
    const { container } = render(<Stroke stroke="red" strokeWidth={2} />, { wrapper });

    expect(container).toBeDefined();
  });
});















