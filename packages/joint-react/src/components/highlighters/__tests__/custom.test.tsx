import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import { Custom } from '../custom';
import * as stories from '../custom.stories';
runStorybookSnapshot({
  Component: Custom,
  stories,
  name: 'Highlighters/Custom',
  withRenderElementWrapper: true,
});
