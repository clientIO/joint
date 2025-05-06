import { create } from '@storybook/theming';
export const PRIMARY = '#ED2637';
export const BG = '#131E29';
export const SECONDARY = '#FF9505';
export const LIGHT = '#DDE6ED';
export const TEXT = '#DDE6ED';
export const theme = create({
  base: 'dark',
  brandTitle: 'JointJS react',
  fontBase: 'Ppfraktionsans, sans-serif',
  brandUrl: 'https://www.jointjs.com/',
  brandImage:
    'https://cdn.prod.website-files.com/63061d4ee85b5a18644f221c/633045c1d726c7116dcbe582_JJS_logo.svg',
  brandTarget: '_self',
  colorPrimary: PRIMARY,
  appBg: BG,
  appContentBg: BG,
  textColor: TEXT,
  colorSecondary: PRIMARY,
  barTextColor: TEXT,
  barSelectedColor: PRIMARY,
  barHoverColor: PRIMARY,
  barBg: BG,
});

export const BUTTON_CLASSNAME =
  'bg-blue-500 cursor-pointer hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-2 text-sm';

export const PAPER_CLASSNAME =
  'border-1 border-gray-300 rounded-lg shadow-md overflow-hidden p-2 mr-2';
