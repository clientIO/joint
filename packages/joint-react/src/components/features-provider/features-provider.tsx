import type { PropsWithChildren } from 'react';
import { useCreatePaperFeature } from '../../hooks/use-paper-features';
import type { AddFeatureOptions } from '../../hooks';
import { PaperFeaturesContext } from '../../context';
import { pickValues } from '../../utils/object-utilities';
import typedMemo from '../../utils/typed-react';

interface Props<T> extends AddFeatureOptions<T>, PropsWithChildren<Record<string, unknown>> {}

/**
 * Provider component that wraps children with a paper feature context.
 * @param props - The feature provider props including id, onAddFeature, and children.
 * @returns The provider element wrapping children.
 */
function PaperFeaturesProviderBase<T>(props: Readonly<Props<T>>) {
  const { id, onAddFeature, children, onUpdateFeature, forwardedRef, onLoad, ...rest } = props;
  const ctx = useCreatePaperFeature<T>(
    { id, onAddFeature, onUpdateFeature, forwardedRef, onLoad },
    pickValues(rest)
  );
  return <PaperFeaturesContext.Provider value={ctx}>{children}</PaperFeaturesContext.Provider>;
}

export const PaperFeaturesProvider = typedMemo(PaperFeaturesProviderBase);
