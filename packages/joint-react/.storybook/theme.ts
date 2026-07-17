import { create } from 'storybook/theming';

// Brands the Storybook chrome (sidebar, toolbar). Diagram colors live in
// `stories/ui/tokens.css`; individual demos keep their own local color consts.
const BRAND = '#ED2637';
const TEXT = '#DDE6ED';
const APP_BG = '#0C141C';
const APP_CONTENT = '#101B25';

export const theme = create({
  base: 'dark',
  brandTitle: 'JointJS React',
  fontBase: 'Ppfraktionsans, ui-sans-serif, system-ui, sans-serif',
  fontCode: 'ui-monospace, "JetBrains Mono", "SFMono-Regular", Menlo, monospace',
  brandUrl: 'https://www.jointjs.com/',
  brandImage:
    'https://cdn.prod.website-files.com/63061d4ee85b5a18644f221c/633045c1d726c7116dcbe582_JJS_logo.svg',
  brandTarget: '_self',

  colorPrimary: BRAND,
  colorSecondary: BRAND,

  appBg: APP_BG,
  appContentBg: APP_CONTENT,
  appPreviewBg: APP_BG,
  appBorderColor: 'rgba(221,230,237,0.10)',
  appBorderRadius: 10,

  textColor: TEXT,
  textMutedColor: '#93A4B3',

  barBg: APP_BG,
  barTextColor: '#93A4B3',
  barSelectedColor: BRAND,
  barHoverColor: BRAND,

  inputBg: APP_CONTENT,
  inputBorder: 'rgba(221,230,237,0.14)',
  inputTextColor: TEXT,
  inputBorderRadius: 8,
});
