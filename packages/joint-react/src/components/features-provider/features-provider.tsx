import type { PropsWithChildren } from 'react';
import { useCreateFeature } from '../../hooks/use-create-features';
import type { AddFeatureOptions, FeatureTarget } from '../../hooks/use-create-features';
import { PaperFeaturesContext, GraphFeaturesContext } from '../../context';
import { pickValues } from '../../utils/object-utilities';
import typedMemo from '../../utils/typed-react';

interface Props<T, Target extends FeatureTarget>
  extends AddFeatureOptions<T, Target>,
    PropsWithChildren<Record<string, unknown>> {
  readonly target: Target;
}

const CONTEXT_BY_TARGET = {
  paper: PaperFeaturesContext,
  graph: GraphFeaturesContext,
} as const;

/**
 * Provider component that wraps children with a feature context.
 * Use `target="paper"` for paper-scoped features or `target="graph"` for graph-scoped features.
 * @param props - The feature provider props including target, id, onAddFeature, and children.
 * @returns The provider element wrapping children.
 */
function FeaturesProviderBase<T, Target extends FeatureTarget>(props: Readonly<Props<T, Target>>) {
  const { target, id, onAddFeature, children, onUpdateFeature, forwardedRef, onLoad, ...rest } =
    props;
  // Safe cast: Target is constrained to FeatureTarget, overloads handle narrowing at call sites
  const ctx = useCreateFeature(
    target,
    { id, onAddFeature, onUpdateFeature, forwardedRef, onLoad },
    pickValues(rest)
  );
  const Context = CONTEXT_BY_TARGET[target];
  return <Context.Provider value={ctx}>{children}</Context.Provider>;
}

export const FeaturesProvider = typedMemo(FeaturesProviderBase);
