import {
  selectResetVersion,
  createSelectPaperVersion,
  selectGraphFeaturesVersion,
} from '../index';
import type { GraphStoreInternalSnapshot } from '../../store/graph-store';

describe('selectors/index', () => {
  const snapshot: GraphStoreInternalSnapshot = {
    papers: {
      'paper-1': { version: 7 } as GraphStoreInternalSnapshot['papers'][string],
    },
    resetVersion: 3,
    graphFeaturesVersion: 11,
  };

  it('selectResetVersion returns resetVersion', () => {
    expect(selectResetVersion(snapshot)).toBe(3);
  });

  it('createSelectPaperVersion returns paper version', () => {
    const select = createSelectPaperVersion('paper-1');
    expect(select(snapshot)).toBe(7);
  });

  it('createSelectPaperVersion returns undefined for unknown paper', () => {
    const select = createSelectPaperVersion('unknown');
    expect(select(snapshot)).toBeUndefined();
  });

  it('selectGraphFeaturesVersion returns graphFeaturesVersion', () => {
    expect(selectGraphFeaturesVersion(snapshot)).toBe(11);
  });
});
