/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react';
import '../../stories/examples/index.css';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';
import { makeRootDocumentation, makeStory } from '../../stories/utils/make-story';
import { SimpleRenderLinkDecorator } from 'storybook-config/decorators/with-simple-data';
import { BaseLink } from './base-link';

export type Story = StoryObj<typeof BaseLink>;
const API_URL = getAPILink('Link.BaseLink', 'variables');

const meta: Meta<typeof BaseLink> = {
  title: 'Components/Link/BaseLink',
  component: BaseLink,
  decorators: [SimpleRenderLinkDecorator],
  tags: ['component'],
  parameters: makeRootDocumentation({
    apiURL: API_URL,
    description: `
The **Link.BaseLink** component sets link properties when rendering custom links. It must be used inside the \`renderLink\` function.

**Key Features:**
- Sets link attributes (stroke, strokeWidth, etc.)
- Sets link markup
- Sets other link properties
- Must be used inside renderLink context
    `,
    usage: `
\`\`\`tsx
import { Link } from '@joint/react';

function RenderLink({ id }) {
  return (
    <>
      <Link.BaseLink attrs={{ line: { stroke: 'blue', strokeWidth: 2 } }} />
    </>
  );
}
\`\`\`
    `,
    props: `
- **attrs**: Link attributes to apply
- **markup**: Link markup to use for rendering
- **...rest**: Additional link properties
    `,
    code: `import { Link } from '@joint/react';

<Link.BaseLink attrs={{ line: { stroke: 'blue' } }} />
    `,
  }),
};

export default meta;

export const Default = makeStory<Story>({
  args: {
    stroke: 'blue',
  },
  apiURL: API_URL,
  name: 'Basic link',
});

export const WithArrowMarkers = makeStory<Story>({
  args: {
    stroke: '#0075f2',
    strokeWidth: 2,
    startMarker: 'arrow',
    endMarker: 'arrow',
  },
  apiURL: API_URL,
  name: 'Arrow markers',
});

export const WithArrowRoundedMarkers = makeStory<Story>({
  args: {
    stroke: '#ed2637',
    strokeWidth: 2,
    startMarker: 'arrow-rounded',
    endMarker: 'arrow-rounded',
  },
  apiURL: API_URL,
  name: 'Rounded arrow markers',
});

export const WithTriangleMarkers = makeStory<Story>({
  args: {
    stroke: '#28a745',
    strokeWidth: 2,
    startMarker: 'triangle',
    endMarker: 'triangle',
  },
  apiURL: API_URL,
  name: 'Triangle markers',
});

export const WithDiamondMarkers = makeStory<Story>({
  args: {
    stroke: '#ffc107',
    strokeWidth: 2,
    startMarker: 'diamond',
    endMarker: 'diamond',
  },
  apiURL: API_URL,
  name: 'Diamond markers',
});

export const WithCircleMarkers = makeStory<Story>({
  args: {
    stroke: '#6f42c1',
    strokeWidth: 2,
    startMarker: 'circle',
    endMarker: 'circle',
  },
  apiURL: API_URL,
  name: 'Circle markers',
});

export const WithDifferentStartEndMarkers = makeStory<Story>({
  args: {
    stroke: '#17a2b8',
    strokeWidth: 2,
    startMarker: 'arrow',
    endMarker: 'circle',
  },
  apiURL: API_URL,
  name: 'Different start and end markers',
});

export const WithCrossMarkers = makeStory<Story>({
  args: {
    stroke: '#dc3545',
    strokeWidth: 2,
    startMarker: 'cross',
    endMarker: 'cross',
  },
  apiURL: API_URL,
  name: 'Cross markers',
});

export const WithLineMarkers = makeStory<Story>({
  args: {
    stroke: '#20c997',
    strokeWidth: 2,
    startMarker: 'line',
    endMarker: 'line',
  },
  apiURL: API_URL,
  name: 'Line markers',
});

export const WithOpenMarkers = makeStory<Story>({
  args: {
    stroke: '#fd7e14',
    strokeWidth: 2,
    startMarker: 'circle-open',
    endMarker: 'triangle-open',
  },
  apiURL: API_URL,
  name: 'Open markers',
});

export const WithRoundedDiamondMarkers = makeStory<Story>({
  args: {
    stroke: '#e83e8c',
    strokeWidth: 2,
    startMarker: 'diamond-rounded',
    endMarker: 'diamond-rounded',
  },
  apiURL: API_URL,
  name: 'Rounded diamond markers',
});

export const NoMarkers = makeStory<Story>({
  args: {
    stroke: '#6c757d',
    strokeWidth: 2,
    startMarker: 'none',
    endMarker: 'none',
  },
  apiURL: API_URL,
  name: 'No markers',
});

// Custom marker function stories
function CustomStarMarkerStory() {
  return (
    <BaseLink
      stroke="#f39c12"
      strokeWidth={2}
      startMarker={(props) => (
        <path
          d="M 0 -8 L 2 -2 L 8 -2 L 3 1 L 5 7 L 0 4 L -5 7 L -3 1 L -8 -2 L -2 -2 z"
          fill={props.color}
          strokeWidth={props.strokeWidth ?? '1'}
        />
      )}
      endMarker={(props) => (
        <path
          d="M 0 -8 L 2 -2 L 8 -2 L 3 1 L 5 7 L 0 4 L -5 7 L -3 1 L -8 -2 L -2 -2 z"
          fill={props.color}
          strokeWidth={props.strokeWidth ?? '1'}
        />
      )}
    />
  );
}

export const WithCustomStarMarkers = makeStory<Story>({
  component: CustomStarMarkerStory,
  apiURL: API_URL,
  name: 'Custom star markers',
});

function CustomSquareMarkerStory() {
  return (
    <BaseLink
      stroke="#3498db"
      strokeWidth={2}
      startMarker={(props) => (
        <rect
          x="-4"
          y="-4"
          width="8"
          height="8"
          fill={props.color}
          strokeWidth={props.strokeWidth ?? '1'}
        />
      )}
      endMarker={(props) => (
        <rect
          x="-4"
          y="-4"
          width="8"
          height="8"
          fill={props.color}
          strokeWidth={props.strokeWidth ?? '1'}
        />
      )}
    />
  );
}

export const WithCustomSquareMarkers = makeStory<Story>({
  component: CustomSquareMarkerStory,
  apiURL: API_URL,
  name: 'Custom square markers',
});

function CustomHeartMarkerStory() {
  return (
    <BaseLink
      stroke="#e74c3c"
      strokeWidth={2}
      startMarker={(props) => (
        <path
          d="M 0 4 C 0 2, -2 0, -4 0 C -6 0, -6 2, -6 4 C -6 6, -4 8, 0 12 C 4 8, 6 6, 6 4 C 6 2, 6 0, 4 0 C 2 0, 0 2, 0 4 z"
          fill={props.color}
          strokeWidth={props.strokeWidth ?? '1'}
        />
      )}
      endMarker={(props) => (
        <path
          d="M 0 4 C 0 2, -2 0, -4 0 C -6 0, -6 2, -6 4 C -6 6, -4 8, 0 12 C 4 8, 6 6, 6 4 C 6 2, 6 0, 4 0 C 2 0, 0 2, 0 4 z"
          fill={props.color}
          strokeWidth={props.strokeWidth ?? '1'}
        />
      )}
    />
  );
}

export const WithCustomHeartMarkers = makeStory<Story>({
  component: CustomHeartMarkerStory,
  apiURL: API_URL,
  name: 'Custom heart markers',
});

function CustomMixedMarkersStory() {
  return (
    <BaseLink
      stroke="#9b59b6"
      strokeWidth={2}
      startMarker="arrow"
      endMarker={(props) => (
        <path
          d="M 0 0 L 10 -6 L 10 6 z M 0 0 L -10 -6 L -10 6 z"
          fill={props.color}
          strokeWidth={props.strokeWidth ?? '2'}
        />
      )}
    />
  );
}

export const WithMixedPredefinedAndCustomMarkers = makeStory<Story>({
  component: CustomMixedMarkersStory,
  apiURL: API_URL,
  name: 'Mixed predefined and custom markers',
});

function CustomComplexMarkerStory() {
  return (
    <BaseLink
      stroke="#16a085"
      strokeWidth={3}
      startMarker={(props) => (
        <g>
          <circle r="6" fill={props.color} />
          <path d="M -4 -4 L 4 4 M 4 -4 L -4 4" stroke="white" strokeWidth="1.5" />
        </g>
      )}
      endMarker={(props) => (
        <g>
          <rect x="-5" y="-5" width="10" height="10" rx="2" fill={props.color} />
          <path d="M -3 0 L 0 -3 L 3 0 L 0 3 z" fill="white" />
        </g>
      )}
    />
  );
}

export const WithCustomComplexMarkers = makeStory<Story>({
  component: CustomComplexMarkerStory,
  apiURL: API_URL,
  name: 'Custom complex markers',
});
