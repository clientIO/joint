import type { Meta, StoryObj } from '@storybook/react/*';
import '../index.css';

import Rectangle from './code-rectangle';
import BorderedImage from './code-bordered-image';
import Circle from './code-circle';
import Cylinder from './code-cylinder';
import DoubleLink from './code-double-link';
import Ellipse from './code-ellipse';
import EmbeddedImage from './code-embedded-image';
import HeaderedRectangle from './code-headered-rectangle';
import Image from './code-image';
import InscribedImage from './code-inscribed-image';
import Link from './code-link';
import Path from './code-path';
import Polygon from './code-polygon';
import PolyLine from './code-polyline';
import ShadowLink from './code-shadow-link';
import TextBlock from './code-text-block';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import RectangleRawCode from './code-rectangle?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import BorderedImageRawCode from './code-bordered-image?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import CircleRawCode from './code-circle?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import CylinderRawCode from './code-cylinder?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import DoubleLinkRawCode from './code-double-link?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import EllipseRawCode from './code-ellipse?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import EmbeddedImageRawCode from './code-embedded-image?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import HeaderedRectangleRawCode from './code-headered-rectangle?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import ImageRawCode from './code-image?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import InscribedImageRawCode from './code-inscribed-image?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import LinkRawCode from './code-link?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import PathRawCode from './code-path?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import PolygonRawCode from './code-polygon?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import PolyLineRawCode from './code-polyline?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import ShadowLinkRawCode from './code-shadow-link?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-expect-error
import TextBlockRawCode from './code-text-block?raw';
import { makeStory } from '@joint/react/src/stories/utils/make-story';

export type Story = StoryObj<typeof Rectangle>;

export default {
  title: 'Examples/Built-in shapes',
  component: Rectangle,
  parameters: {
    docs: {
      description: {
        component: `
Render built-in [standard JointJS shapes](https://docs.jointjs.com/learn/features/shapes/built-in-shapes/standard).

Each example below demonstrates a built-in shape with a rendered demo and source code.  
Refer to the [API reference](https://docs.jointjs.com/api/shapes/standard) for full configuration options.
        `,
      },
    },
  },
} satisfies Meta<typeof Rectangle>;

// Export stories with descriptions
export const WithRectangle = makeStory({
  component: Rectangle,
  code: RectangleRawCode,
  name: 'Rectangle',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/Rectangle',
  description: 'A rectangle with a label.',
});

export const WithBorderedImage = makeStory({
  component: BorderedImage,
  code: BorderedImageRawCode,
  name: 'BorderedImage',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/BorderedImage',
  description: 'An image with a border.',
});

export const WithCircle = makeStory({
  component: Circle,
  code: CircleRawCode,
  name: 'Circle',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/Circle',
  description: 'A circle with a label.',
});

export const WithCylinder = makeStory({
  component: Cylinder,
  code: CylinderRawCode,
  name: 'Cylinder',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/Cylinder',
  description: 'A cylinder shape.',
});

export const WithDoubleLink = makeStory({
  component: DoubleLink,
  code: DoubleLinkRawCode,
  name: 'DoubleLink',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/DoubleLink',
  description: 'A link with two connectors.',
});

export const WithEllipse = makeStory({
  component: Ellipse,
  code: EllipseRawCode,
  name: 'Ellipse',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/Ellipse',
  description: 'An ellipse with a label.',
});

export const WithEmbeddedImage = makeStory({
  component: EmbeddedImage,
  code: EmbeddedImageRawCode,
  name: 'EmbeddedImage',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/EmbeddedImage',
  description: 'An image embedded into a rectangle with a label.',
});

export const WithHeaderedRectangle = makeStory({
  component: HeaderedRectangle,
  code: HeaderedRectangleRawCode,
  name: 'HeaderedRectangle',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/HeaderedRectangle',
  description: 'A rectangle with a header.',
});

export const WithImage = makeStory({
  component: Image,
  code: ImageRawCode,
  name: 'Image',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/Image',
  description: 'An image with a label.',
});

export const WithInscribedImage = makeStory({
  component: InscribedImage,
  code: InscribedImageRawCode,
  name: 'InscribedImage',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/InscribedImage',
  description: 'An image inscribed in an ellipse with a label.',
});

export const WithLink = makeStory({
  component: Link,
  code: LinkRawCode,
  name: 'Link',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/Link',
  description: 'A single line link.',
});

export const WithPath = makeStory({
  component: Path,
  code: PathRawCode,
  name: 'Path',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/Path',
  description: 'A path with a label.',
});

export const WithPolygon = makeStory({
  component: Polygon,
  code: PolygonRawCode,
  name: 'Polygon',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/Polygon',
  description: 'A polygon with a label.',
});

export const WithPolyLine = makeStory({
  component: PolyLine,
  code: PolyLineRawCode,
  name: 'PolyLine',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/PolyLine',
  description: 'A polyline with a label.',
});

export const WithShadowLink = makeStory({
  component: ShadowLink,
  code: ShadowLinkRawCode,
  name: 'ShadowLink',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/ShadowLink',
  description: 'A link with a shadow.',
});

export const WithTextBlock = makeStory({
  component: TextBlock,
  code: TextBlockRawCode,
  name: 'TextBlock',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard/TextBlock',
  description: 'A text block with a label.',
});
