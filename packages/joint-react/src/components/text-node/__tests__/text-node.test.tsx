import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import { TextNode } from '../text-node';
import * as stories from '../text-node.stories';
runStorybookSnapshot({
  Component: TextNode,
  name: 'TextNode',
  stories,
});
