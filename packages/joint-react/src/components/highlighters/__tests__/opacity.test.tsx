import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import { Opacity } from '../opacity';
import * as stories from '../opacity.stories';
runStorybookSnapshot({
  Component: Opacity,
  stories,
  name: 'Highlighters/Opacity',
  withRenderElementWrapper: true,
});
