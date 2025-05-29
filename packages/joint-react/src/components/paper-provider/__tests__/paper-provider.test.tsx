import { render } from '@testing-library/react';
import { useEffect } from 'react';
import { PaperProvider } from '../paper-provider';
import { usePaper } from '../../../hooks';
import type { dia } from '@joint/core';
import { GraphProvider } from '../../graph-provider/graph-provider';
import { Paper } from '../../paper/paper';

function MockChild() {
  const paper = usePaper();
  useEffect(() => {
    paper.trigger('TestEvent', { id: 'mock' });
  }, [paper]);
  return <div>Mock Child</div>;
}

describe('PaperProvider', () => {
  it('should create a paper context and pass paper instance to children', async () => {
    const onCustomEvent = jest.fn();
    // here width will be firstly 100, and then it will change to 99.
    render(
      <PaperProvider width={100}>
        {/* Mock children fire event, so we test that it works */}
        <MockChild />
        <Paper width={99} onCustomEvent={onCustomEvent}></Paper>
      </PaperProvider>
    );
    expect(onCustomEvent).toHaveBeenCalled();
  });

  it('should set clickThreshold and other paper options', () => {
    let customPaper: dia.Paper | undefined;
    function ChildCheck() {
      customPaper = usePaper();
      return null;
    }
    render(
      <PaperProvider>
        <ChildCheck />
      </PaperProvider>
    );
    expect(customPaper?.options.clickThreshold).toBe(10);
  });

  it('should allow outside component to access paper and its options', () => {
    let outsidePaper: dia.Paper | undefined;
    function OutsideComponent() {
      outsidePaper = usePaper();
      return <div>Outside</div>;
    }
    render(
      <PaperProvider width={123} height={456} clickThreshold={42}>
        <OutsideComponent />
        <Paper width={789} />
      </PaperProvider>
    );
    expect(outsidePaper).toBeDefined();
    expect(outsidePaper?.options.width).toBe(123);
    expect(outsidePaper?.options.height).toBe(456);
    expect(outsidePaper?.options.clickThreshold).toBe(42);
  });

  it('should update paper options when PaperProvider props change', () => {
    let paperInstance: dia.Paper | undefined;
    function CheckPaper() {
      paperInstance = usePaper();
      return null;
    }
    let reRenders = 0;
    const { rerender } = render(
      <PaperProvider width={10} height={20}>
        {reRenders++}
        <CheckPaper />
      </PaperProvider>
    );
    expect(paperInstance?.options.width).toBe(10);
    expect(paperInstance?.options.height).toBe(20);
    expect(reRenders).toBe(1);

    rerender(
      <PaperProvider width={99} height={77}>
        {reRenders++}
        <CheckPaper />
      </PaperProvider>
    );
    expect(reRenders).toBe(2);
    expect(paperInstance?.options.width).toBe(99);
    expect(paperInstance?.options.height).toBe(77);
  });

  it('should share the same paper instance between outside and inside Paper components', () => {
    let outsidePaper: dia.Paper | undefined;
    let insidePaper: dia.Paper | undefined;
    function OutsideComponent() {
      outsidePaper = usePaper();
      return null;
    }
    function InsideComponent() {
      insidePaper = usePaper();
      return null;
    }
    render(
      <GraphProvider>
        <PaperProvider width={55}>
          <OutsideComponent />
          <Paper>
            <InsideComponent />
          </Paper>
        </PaperProvider>
      </GraphProvider>
    );
    expect(outsidePaper).toBeDefined();
    expect(insidePaper).toBeDefined();
    expect(outsidePaper).toBe(insidePaper);
    expect(outsidePaper?.options.width).toBe(55);
  });
});
