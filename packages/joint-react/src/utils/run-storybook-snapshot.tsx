import { render } from '@testing-library/react'

interface Options<T> {
  Component: React.ComponentType<T>
  name: string
  // we have to use any here because we don't know the type of the story
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stories: Record<string, any>
}

/**
 * Utility function to create automatic jest unit test snapshots from storybook stories.
 */
export function runStorybookSnapshot<T>(options: Options<T>) {
  const { stories, Component, name } = options
  const keys = Object.keys(stories).filter((key) => key !== 'default')
  describe(name, () => {
    it.each(keys)('%p', (key) => {
      const story = stories[key as keyof typeof stories]

      const props = ('args' in story ? story.args : {}) as T & {
        children?: React.ReactNode
      }
      // ACT
      const tree = render(<Component {...props} />)

      // ASSERTS
      expect(tree).toMatchSnapshot()
    })
  })
}
