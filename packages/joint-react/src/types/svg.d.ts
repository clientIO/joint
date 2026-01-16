import 'react';

/**
 * Extends React's SVG types to include JointJS-specific attributes like 'magnet'.
 * This allows TypeScript to recognize custom attributes used by JointJS.
 */
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface SVGProps<T extends SVGElement = SVGElement> {
    /**
     * JointJS-specific attribute that controls whether an element can be used as a connection point.
     * - 'passive': Element cannot be used as a connection point
     * - 'true': Element can be used as a connection point (default)
     * - 'false': Element cannot be used as a connection point
     */
    magnet?: 'passive';
  }
}
