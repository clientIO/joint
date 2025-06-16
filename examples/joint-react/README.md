
# joint-react Demo Example

This project demonstrates how to use the `@joint/react` library to integrate JointJS with React. It includes a Vite-based TypeScript setup along with Tailwind CSS for styling and Font Awesome for icons. The example shows a basic graph with interactive elements like messages and tables, along with a minimap and toolbar for manipulating the elements in the graph.

## Project Overview

This demo project allows you to:

- Create and display a graph using `@joint/react` and `@joint/core`
- Include interactive elements (messages and tables)
- Use a toolbar to manipulate the graph (e.g., add/remove elements, zoom to fit, toggle the minimap)
- Display a minimap of the graph
- Leverage Tailwind CSS for styling and Font Awesome for icons

The core features include:

- **Elements**: Display message elements (alerts/info) and tables
- **Links**: Connect elements with links
- **Toolbar**: Tools to duplicate, remove, or zoom the graph
- **Minimap**: A minimap that provides an overview of the graph

## Features

- **Graph Elements**: Each element can be selected and updated interactively.
- **Links**: The elements are connected with links, and the links are customizable.
- **Minimap**: Toggle the minimap to view the entire graph at once.
- **Toolbar**: The toolbar allows for duplication, removal, and zooming of elements.

## Installation

To run this demo project locally, follow these steps:

### Prerequisites

- Node.js (v16.x or higher)
- Yarn (recommended) or npm

### 1. Clone the repository

```bash
git clone <repository-url>
cd joint-react
```

### 2. Install dependencies

```bash
yarn install
# or if you're using npm
npm install
```

### 3. Run the project

To start the development server, use:

```bash
yarn dev
# or if you're using npm
npm run dev
```

This will start a Vite development server, and the app should be available at `http://localhost:3000`.

### 4. Build the project

To build the project for production, run:

```bash
yarn build
# or if you're using npm
npm run build
```

### 5. Preview the production build

To preview the production build locally, use:

```bash
yarn preview
# or if you're using npm
npm run preview
```

## How It Works

1. **Elements and Links**: The example creates various elements such as "alert," "info," and "table" elements, along with links connecting them. The elements have customizable attributes such as title, description, and input text. The links have styling properties such as stroke color and dashed lines.

2. **Toolbar**: The toolbar allows users to duplicate or remove selected elements from the graph. The "Zoom to fit" button repositions the graph to fit the content.

3. **Minimap**: The minimap is a smaller view of the graph that helps users quickly navigate through the entire graph.

4. **Highlighter**: Each element can be highlighted when selected to provide a better visual indication of interaction.

## Dependencies

- `@joint/react`: React wrapper for JointJS, used to create and interact with graphs and elements.
- `react`: React.js for building the UI.
- `react-dom`: DOM rendering for React.
- `tailwindcss`: Utility-first CSS framework for styling.
- `font-awesome`: Icons used for the toolbar and elements.

## Project Structure

```
src/
├── components/
│   ├── MessageComponent.tsx
│   ├── TableElement.tsx
│   └── Toolbar.tsx
├── utils/
│   ├── create.ts
│   ├── paper.ts
├── App.tsx
└── main.tsx
public/
├── index.html
└── vite.svg
tailwind.config.js
vite.config.ts
tsconfig.json
```

## Scripts

- `dev`: Starts the development server.
- `build`: Builds the project for production.
- `lint`: Runs ESLint for linting the project.
- `preview`: Previews the production build.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
