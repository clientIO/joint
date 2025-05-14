import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import { PortItem } from '../port-item';
import * as stories from '../port-item.stories';

runStorybookSnapshot({
  Component: PortItem,
  stories,
  name: 'Port/Item',
  withRenderElementWrapper: true,
});
