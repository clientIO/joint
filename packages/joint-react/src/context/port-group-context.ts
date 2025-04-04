import { createContext, useContext } from 'react';

export const PortGroupContext = createContext<string | undefined>(undefined);

/**
 * A provider for the port group context.
 * @returns - The port group.
 * @group context
 * @internal
 * @description
 * This context is used to provide the port group to the components.
 * @example
 * ```ts
 * const groupId = usePortGroup();
 * ```
 */
export function usePortGroup() {
  const context = useContext(PortGroupContext);
  if (context === undefined) {
    throw new Error('usePortGroup must be used within a PortGroupProvider');
  }
  return context;
}
