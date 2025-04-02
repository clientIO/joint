import { typeToReactType, type PaperEvents, type PaperEventType } from '../types/event.types';

/**
 * Handles the events of the paper. Convert paper events to `react` way events.
 * @group utils
 */
export function handleEvent(type: PaperEventType, events: PaperEvents, ...args: unknown[]) {
  const reactType = typeToReactType(type);
  const event = events[reactType];
  if (!event) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  event(...args);
}
