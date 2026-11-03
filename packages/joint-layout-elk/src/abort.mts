// Not part of the public API (not re-exported from `index.mts`).

// The signal's reason - whatever it is, `null` included. Only where the browser doesn't
// support `reason` (it is `undefined` then) a default one is made up.
export function getAbortReason(signal: AbortSignal): unknown {
    return (signal.reason !== undefined) ? signal.reason : new DOMException('The layout was aborted.', 'AbortError');
}

export function throwIfAborted(signal: AbortSignal | undefined): void {
    if (signal?.aborted) throw getAbortReason(signal);
}

/**
 * Settles as `promise` does, or rejects with `signal`'s reason as soon as it is aborted -
 * whichever comes first. `promise` itself is left to run (e.g. ELK on the main thread,
 * which can't be stopped), only its result is ignored.
 */
export function abortable<T>(promise: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
    if (!signal) return promise;
    return new Promise<T>((resolve, reject) => {
        const onAbort = () => reject(getAbortReason(signal));
        if (signal.aborted) {
            onAbort();
            return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
        promise
            .then(resolve, reject)
            .finally(() => signal.removeEventListener('abort', onAbort));
    });
}
