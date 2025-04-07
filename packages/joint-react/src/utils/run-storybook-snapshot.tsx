import { render } from '@testing-library/react';

interface Options<StorybookOptions> {
  Component: React.ComponentType<StorybookOptions>;
  name: string;
  // we have to use any here because we don't know the type of the story
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stories: Record<string, any>;
}

/**
 * Runs a snapshot test for each story in the provided options.
 * @param options - The options for the snapshot test.
 * @param options.Component - The component to render.
 * @param options.name - The name of the test suite.
 * @param options.stories - The stories to test.
 */
export function runStorybookSnapshot<StorybookOptions>(options: Options<StorybookOptions>) {
  const { stories, Component, name } = options;
  const keys = Object.keys(stories).filter((key) => key !== 'default');
  describe(name, () => {
    it.each(keys)('%p', (key) => {
      const story = stories[key as keyof typeof stories];

      const props = ('args' in story ? story.args : {}) as StorybookOptions & {
        children?: React.ReactNode;
      };
      // ACT
      const tree = render(<Component {...props} />);

      // ASSERTS
      expect(tree).toMatchSnapshot();
    });
  });
}
