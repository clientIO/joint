import {
  unstable_cancelCallback as cancelCallback,
  unstable_scheduleCallback as scheduleCallback,
  unstable_getCurrentPriorityLevel as getCurrentPriorityLevel,
} from 'scheduler';
import { startTransition } from 'react';
import { getValue, type ExternalStoreLike, type Update } from './create-state';

/**
 * Internal pending state for a wrapped external store.
 */
interface WrappedStoreState<T> {
  readonly baseStore: ExternalStoreLike<T>;
  pendingSnapshot?: T;
  hasPendingSnapshot: boolean;
}

/**
 * Global scheduler runtime for all wrapped stores.
 * It batches writes in the same tick and flushes them in one scheduler callback.
 */
class GlobalScheduler {
  private readonly wrappedByBaseStore = new WeakMap<object, ExternalStoreLike<unknown>>();
  private readonly pendingStores = new Set<WrappedStoreState<unknown>>();
  private callbackId: unknown | null = null;
  private isFlushing = false;

  private scheduleFlush(): void {
    if (this.callbackId !== null) {
      return;
    }
    this.callbackId = scheduleCallback(getCurrentPriorityLevel(), this.flushScheduledWork);
  }

  private flushStores(): void {
    if (this.pendingStores.size === 0) {
      return;
    }

    const storesToFlush = [...this.pendingStores];
    this.pendingStores.clear();

    for (const storeState of storesToFlush) {
      if (!storeState.hasPendingSnapshot) {
        continue;
      }
      const nextSnapshot = storeState.pendingSnapshot as unknown;
      storeState.baseStore.setState(nextSnapshot);
      storeState.pendingSnapshot = undefined;
      storeState.hasPendingSnapshot = false;
    }
  }

  private flushScheduledWork = (): void => {
    this.callbackId = null;
    if (this.isFlushing) {
      return;
    }

    this.isFlushing = true;
    try {
      while (this.pendingStores.size > 0) {
        this.flushStores();
      }
    } finally {
      this.isFlushing = false;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wrap<TStore extends ExternalStoreLike<any>>(store: TStore): TStore {
    type Snapshot = TStore extends ExternalStoreLike<infer TSnapshot> ? TSnapshot : never;
    const baseStoreObject = store as unknown as object;
    const existingWrappedStore = this.wrappedByBaseStore.get(baseStoreObject);
    if (existingWrappedStore) {
      return existingWrappedStore as TStore;
    }

    const storeState: WrappedStoreState<Snapshot> = {
      baseStore: store as unknown as ExternalStoreLike<Snapshot>,
      hasPendingSnapshot: false,
      pendingSnapshot: undefined,
    };

    const wrappedStore = {
      ...store,
      getSnapshot: () => {
        if (storeState.hasPendingSnapshot) {
          return storeState.pendingSnapshot as Snapshot;
        }
        return store.getSnapshot() as Snapshot;
      },
      subscribe: (listener: () => void) => store.subscribe(listener),
      setState: (updater: Update<Snapshot>) => {
        const previousSnapshot = storeState.hasPendingSnapshot
          ? (storeState.pendingSnapshot as Snapshot)
          : (store.getSnapshot() as Snapshot);
        storeState.pendingSnapshot = getValue(previousSnapshot, updater);
        storeState.hasPendingSnapshot = true;
        this.pendingStores.add(storeState as WrappedStoreState<unknown>);
        this.scheduleFlush();
      },
    } as TStore;

    if (
      'setStateTransition' in store &&
      typeof (store as { readonly setStateTransition?: unknown }).setStateTransition === 'function'
    ) {
      (
        wrappedStore as TStore & {
          setStateTransition: (updater: Update<Snapshot>) => void;
        }
      ).setStateTransition = (updater: Update<Snapshot>) => {
        startTransition(() => {
          wrappedStore.setState(updater);
        });
      };
    }

    if ('clean' in store && typeof (store as { readonly clean?: unknown }).clean === 'function') {
      (
        wrappedStore as TStore & {
          clean: () => void;
        }
      ).clean = () => {
        storeState.pendingSnapshot = undefined;
        storeState.hasPendingSnapshot = false;
        this.pendingStores.delete(storeState as WrappedStoreState<unknown>);
        (store as { clean: () => void }).clean();
      };
    }

    this.wrappedByBaseStore.set(baseStoreObject, wrappedStore as ExternalStoreLike<unknown>);
    return wrappedStore;
  }

  flushNowForTests(): void {
    if (this.callbackId !== null) {
      cancelCallback(this.callbackId as never);
      this.callbackId = null;
    }
    this.flushScheduledWork();
  }
}

export const scheduler = new GlobalScheduler();
