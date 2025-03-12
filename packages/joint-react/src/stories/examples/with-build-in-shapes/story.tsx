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

export type Story = StoryObj<typeof Rectangle>;

export default {
  title: 'Examples/With build in shapes',
  component: Rectangle,
} satisfies Meta<typeof Rectangle>;

export const WithRectangle: Story = {};
export const WithBorderedImage: Story = {
  render: BorderedImage,
};
export const WithCircle: Story = {
  render: Circle,
};
export const WithCylinder: Story = {
  render: Cylinder,
};
export const WithDoubleLink: Story = {
  render: DoubleLink,
};
export const WithEllipse: Story = {
  render: Ellipse,
};
export const WithEmbeddedImage: Story = {
  render: EmbeddedImage,
};
export const WithHeaderedRectangle: Story = {
  render: HeaderedRectangle,
};
export const WithImage: Story = {
  render: Image,
};
export const WithInscribedImage: Story = {
  render: InscribedImage,
};
export const WithLink: Story = {
  render: Link,
};
export const WithPath: Story = {
  render: Path,
};
export const WithPolygon: Story = {
  render: Polygon,
};
export const WithPolyLine: Story = {
  render: PolyLine,
};
export const WithShadowLink: Story = {
  render: ShadowLink,
};
export const WithTextBlock: Story = {
  render: TextBlock,
};
