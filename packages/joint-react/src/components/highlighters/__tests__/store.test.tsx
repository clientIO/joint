import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import { Stroke } from '../stroke';
import * as stories from '../stroke.stories';
runStorybookSnapshot({
  Component: Stroke,
  stories,
  name: 'Highlighters/Stroke',
  withRenderElementWrapper: true,
});
