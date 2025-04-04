import { typeToReactType, type PaperEvents, type PaperEventType } from '../types/event.types';

/**
 * Handles events for the paper.
 * @param type - The type of the event.
 * @param events - The events object containing the event handlers.
 * @param args - The arguments to pass to the event handler.
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
