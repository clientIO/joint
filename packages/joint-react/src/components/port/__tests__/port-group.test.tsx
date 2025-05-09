import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import { PortGroup } from '../port-group';
import * as stories from '../port-group.stories';

runStorybookSnapshot({
  Component: PortGroup,
  stories,
  name: 'Port/Item',
  withRenderElementWrapper: true,
});
