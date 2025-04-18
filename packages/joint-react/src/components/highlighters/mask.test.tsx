import { runStorybookSnapshot } from '../../utils/run-storybook-snapshot';
import { Mask } from './mask';
import * as stories from './mask.stories';
runStorybookSnapshot({
  Component: Mask,
  stories,
  name: 'Highlighters/Mask',
  withRenderElementWrapper: true,
});
