export function createScheduler(): (callback: () => void) => void {
  let scheduled = false;
  let callbacks = new Set<() => void>();

  const flush = (): void => {
    scheduled = false;

    const pending = callbacks;
    callbacks = new Set();

    for (const callback of pending) {
      callback();
    }

    if (callbacks.size > 0 && !scheduled) {
      scheduled = true;
      queueMicrotask(flush);
    }
  };

  return (callback: () => void): void => {
    callbacks.add(callback);

    if (scheduled) {
      return;
    }

    scheduled = true;
    queueMicrotask(flush);
  };
}

export const simpleScheduler = createScheduler();
