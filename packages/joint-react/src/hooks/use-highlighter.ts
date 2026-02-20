import { highlighters, type dia, type highlighters as highlighterTypes } from '@joint/core';
import { useId, useRef } from 'react';
import { useCellId } from './use-cell-id';
import { useImperativeApi } from './use-imperative-api';
import { usePaper } from './use-paper';
import { assignOptions, dependencyExtract } from '../utils/object-utilities';

type HighlighterCellView =
  | dia.ElementView<dia.Element<dia.Element.Attributes, dia.ModelSetOptions>>
  | dia.LinkView<dia.Link<dia.Link.Attributes, dia.ModelSetOptions>>;

interface HighlighterConfigBase {
  readonly isEnabled?: boolean;
  readonly target?: dia.HighlighterView.NodeSelector;
  readonly ref?: React.RefObject<SVGElement | null>;
}

type ReservedCustomOptionKeys = keyof HighlighterConfigBase | 'type' | 'create';

/**
 * Configuration for the built-in mask highlighter.
 * Keep highlighter arguments flattened at the top level (e.g. `padding`, `attrs`).
 */
export type MaskHighlighterConfig = HighlighterConfigBase &
  highlighterTypes.MaskHighlighterArguments & {
    readonly type: 'mask';
  };

/**
 * Configuration for the built-in opacity highlighter.
 * Keep highlighter arguments flattened at the top level (e.g. `alphaValue`).
 */
export type OpacityHighlighterConfig = HighlighterConfigBase &
  highlighterTypes.OpacityHighlighterArguments & {
    readonly type: 'opacity';
  };

/**
 * Data passed to custom highlighter creators.
 * @template Options - Custom highlighter options type.
 */
export interface CustomHighlighterCreateContext<
  Options extends dia.HighlighterView.Options &
    Record<string, unknown> = dia.HighlighterView.Options & Record<string, unknown>,
> {
  readonly cellView: HighlighterCellView;
  readonly element: dia.HighlighterView.NodeSelector | Record<string, unknown>;
  readonly highlighterId: string;
  readonly options: Options;
}

/**
 * Configuration for custom highlighters.
 * Keep custom highlighter arguments flattened at the top level.
 * @template Options - Custom highlighter options type.
 */
export type CustomHighlighterConfig<
  Options extends dia.HighlighterView.Options &
    Record<string, unknown> = dia.HighlighterView.Options & Record<string, unknown>,
> = HighlighterConfigBase &
  Omit<Options, ReservedCustomOptionKeys> & {
    readonly type: 'custom';
    readonly create: (
      context: CustomHighlighterCreateContext<Options>
    ) => dia.HighlighterView<Options>;
  };

/**
 * Flattened hook configuration for built-in and custom highlighters.
 * @template Options - Custom highlighter options type.
 */
export type UseHighlighterConfig<
  Options extends dia.HighlighterView.Options &
    Record<string, unknown> = dia.HighlighterView.Options & Record<string, unknown>,
> = MaskHighlighterConfig | OpacityHighlighterConfig | CustomHighlighterConfig<Options>;

/**
 * Hook state returned by `useHighlighter`.
 */
export interface UseHighlighterResult {
  readonly ref: React.RefObject<SVGElement | null>;
  readonly highlighterId: string;
  readonly isReady: boolean;
}

/**
 * Type guard for mask highlighter configuration.
 * @param config - Hook configuration.
 * @returns True when `type` is `mask`.
 */
export function isMaskHighlighterConfig(
  config: UseHighlighterConfig
): config is MaskHighlighterConfig {
  return config.type === 'mask';
}

/**
 * Type guard for opacity highlighter configuration.
 * @param config - Hook configuration.
 * @returns True when `type` is `opacity`.
 */
export function isOpacityHighlighterConfig(
  config: UseHighlighterConfig
): config is OpacityHighlighterConfig {
  return config.type === 'opacity';
}

/**
 * Type guard for custom highlighter configuration.
 * @template Options - Custom highlighter options type.
 * @param config - Hook configuration.
 * @returns True when `type` is `custom`.
 */
export function isCustomHighlighterConfig<
  Options extends dia.HighlighterView.Options &
    Record<string, unknown> = dia.HighlighterView.Options & Record<string, unknown>,
>(config: UseHighlighterConfig<Options>): config is CustomHighlighterConfig<Options> {
  return config.type === 'custom';
}

/**
 * Returns a shallow copy of the config without shared hook keys.
 * @param config - Highlighter config.
 * @returns Object containing only highlighter-specific option fields.
 */
function stripSharedConfigKeys<T extends Record<string, unknown>>(
  config: T
): Omit<T, keyof HighlighterConfigBase | 'type' | 'create'> {
  const options = { ...config };
  delete options.type;
  delete options.isEnabled;
  delete options.target;
  delete options.ref;
  delete options.create;
  return options as Omit<T, keyof HighlighterConfigBase | 'type' | 'create'>;
}

/**
 * Extracts flattened mask options.
 * @param config - Mask config.
 * @returns Mask highlighter arguments.
 */
function getMaskOptions(config: MaskHighlighterConfig): highlighterTypes.MaskHighlighterArguments {
  return stripSharedConfigKeys(config);
}

/**
 * Extracts flattened opacity options.
 * @param config - Opacity config.
 * @returns Opacity highlighter arguments.
 */
function getOpacityOptions(
  config: OpacityHighlighterConfig
): highlighterTypes.OpacityHighlighterArguments {
  return stripSharedConfigKeys(config);
}

/**
 * Extracts flattened custom options.
 * @template Options - Custom highlighter options type.
 * @param config - Custom config.
 * @returns Custom options object passed to `create`.
 */
function getCustomOptions<Options extends dia.HighlighterView.Options & Record<string, unknown>>(
  config: CustomHighlighterConfig<Options>
): Options {
  return stripSharedConfigKeys(config) as unknown as Options;
}

/**
 * Returns the flattened options object for the current config.
 * @template Options - Custom highlighter options type.
 * @param config - Hook configuration.
 * @returns Highlighter option fields for the underlying highlighter instance.
 */
function getHighlighterOptions<
  Options extends dia.HighlighterView.Options & Record<string, unknown>,
>(
  config: UseHighlighterConfig<Options>
):
  | highlighterTypes.MaskHighlighterArguments
  | highlighterTypes.OpacityHighlighterArguments
  | Options {
  if (isCustomHighlighterConfig(config)) return getCustomOptions(config);
  if (isMaskHighlighterConfig(config)) return getMaskOptions(config);
  return getOpacityOptions(config);
}

/**
 * Attaches a highlighter to the current cell view and keeps it in sync.
 * Highlighter arguments are flattened on the config object (no nested `options` object).
 * If `ref` is omitted, an internal ref is used and returned.
 * @group Hooks
 * @template Options - Custom highlighter options type.
 * @param config - Flattened highlighter configuration.
 * @returns Highlighter lifecycle state and resolved `ref`.
 * @example
 * ```tsx
 * const ref = useRef<SVGRectElement>(null);
 * useHighlighter({
 *   type: 'mask',
 *   isEnabled: isHovered,
 *   padding: 2,
 *   attrs: { stroke: '#5b9bff', 'stroke-width': 2 },
 *   ref,
 * });
 * ```
 */
export function useHighlighter<
  Options extends dia.HighlighterView.Options &
    Record<string, unknown> = dia.HighlighterView.Options & Record<string, unknown>,
>(config: UseHighlighterConfig<Options>): UseHighlighterResult {
  const cellId = useCellId();
  const paper = usePaper();
  const highlighterId = useId();
  const internalRef = useRef<SVGElement | null>(null);
  const resolvedRef = config.ref ?? internalRef;
  const hasPaper = !!paper;

  const { isReady } = useImperativeApi(
    {
      onLoad() {
        if (!paper) {
          throw new Error('Paper not found in useHighlighter');
        }

        const cellView = paper.findViewByModel(cellId) as HighlighterCellView | undefined;
        if (!cellView) {
          throw new Error('CellView not found for highlighter');
        }

        const element: dia.HighlighterView.NodeSelector | Record<string, unknown> =
          resolvedRef.current ?? config.target ?? {};
        let instance: dia.HighlighterView<Options>;
        if (isCustomHighlighterConfig(config)) {
          const options = getCustomOptions(config);
          instance = config.create({
            cellView,
            element,
            highlighterId,
            options,
          });
        } else if (isMaskHighlighterConfig(config)) {
          const options = getMaskOptions(config);
          instance = highlighters.mask.add(
            cellView,
            element,
            highlighterId,
            options
          ) as unknown as dia.HighlighterView<Options>;
        } else {
          const options = getOpacityOptions(config);
          instance = highlighters.opacity.add(
            cellView,
            element,
            highlighterId,
            options
          ) as unknown as dia.HighlighterView<Options>;
        }

        return {
          instance,
          cleanup() {
            instance.remove();
          },
        };
      },
      onUpdate(instance) {
        const previousOptions = instance.options ?? {};
        const options = getHighlighterOptions(config);
        assignOptions(previousOptions, options as Partial<Options>);
        // @ts-expect-error Internal JointJS API
        instance.update();
      },
      isDisabled: !hasPaper || config.isEnabled === false,
    },
    [
      config.type,
      config.target,
      config.ref,
      config.isEnabled,
      ...dependencyExtract(getHighlighterOptions(config)),
    ]
  );

  return {
    ref: resolvedRef,
    highlighterId,
    isReady,
  };
}
