<p align="center">
  <img src="https://cdn.prod.website-files.com/63061d4ee85b5a18644f221c/633045c1d726c7116dcbe582_JJS_logo.svg" alt="JointJS" height="56" />
</p>

<h1 align="center">JointJS for React</h1>

<p align="center">
  <strong>Production-scale diagramming for React.</strong><br/>
  A first-class React integration for <a href="https://jointjs.com">JointJS</a> — real components and hooks for building complex diagramming apps, with full control over the data model, rendering, and interactions, using the React patterns you already know.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@joint/react"><img src="https://img.shields.io/npm/v/@joint/react?style=flat-square&color=0EA5E9" alt="npm" /></a>
  <a href="https://www.npmjs.com/package/@joint/react"><img src="https://img.shields.io/npm/types/@joint/react?style=flat-square&color=3178C6" alt="types" /></a>
  <a href="https://www.npmjs.com/package/@joint/react"><img src="https://img.shields.io/npm/dm/@joint/react?style=flat-square&color=F59E0B" alt="downloads" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@joint/react?style=flat-square&color=10B981" alt="license" /></a>
</p>

<p align="center">
  🚀 <a href="#quick-start">Quick start</a> ·
  🧩 <a href="https://www.jointjs.com/demos/ai-workflow-builder">Live Example</a> ·
  📖 <a href="#learn-more">Learn more</a>
</p>

[![Use Cases](https://github.com/user-attachments/assets/fc6de738-3fad-48f7-99aa-ba8c3729d9b1)](https://github.com/user-attachments/assets/fc6de738-3fad-48f7-99aa-ba8c3729d9b1)

---

Built on the proven JointJS core, you get a mature diagramming UI library and an idiomatic React layer in one. Like JointJS, it's open source.

## Why JointJS for React

- **A real data model.** A serializable graph you can query, transform, and persist — the backbone for complex, stateful diagram applications, not just visual nodes.
- **Full control.** Complete control over how diagrams render and behave — shapes, ports, links, routing, and custom interactions.
- **Production-grade UX.** The interaction details end users expect come built in: connection snapping, link routing that avoids obstacles, element and link tools, highlighters for hover and selection states. Good UX is designed into every feature, not left for you to assemble.
- **Performance at scale.** Smooth interaction on large graphs with thousands of nodes.
- **Idiomatic React.** Real components and hooks that fit naturally into your existing React app and tooling.

## Installation

```bash
npm install @joint/react     # or pnpm add / yarn add / bun add
```

Peer dependency: **React 18 or 19**.

## Quick start

```tsx
import { GraphProvider, Paper, HTMLBox, type CellRecord } from '@joint/react';

interface NodeData {
  label: string;
}

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: '1', type: 'element', position: { x: 40, y: 40 }, data: { label: 'Hello' } },
  { id: '2', type: 'element', position: { x: 280, y: 180 }, data: { label: 'World' } },
  { id: '1 → 2', type: 'link', source: { id: '1' }, target: { id: '2' } },
];

function renderElement(data: NodeData) {
  return <HTMLBox>{data.label}</HTMLBox>;
}

export default function Diagram() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Paper style={{ width: '100%', height: 600 }} renderElement={renderElement} />
    </GraphProvider>
  );
}
```

`GraphProvider` holds the graph state, `Paper` renders it, and `renderElement` turns each node's data into a React component. See [Learn more](#learn-more) for the full getting-started guide.

## When is JointJS for React the right choice?

JointJS for React is built for production-scale diagramming — applications where the diagram is a core part of the product and has to handle real complexity: a rich data model, large graphs, domain-specific shapes, and deep control over interactions and rendering.

Production-scale is not only about node count. Most workflow tools top out at tens of nodes, yet their users still expect a polished editing experience: precise connections, clear feedback on hover and selection, links that route cleanly around obstacles. JointJS for React treats that end-user UX as part of the library, so you ship it instead of building it.

It's designed to be the layer you build on as your requirements grow, from the first prototype through to a mature, scaling application.

## Use cases

JointJS for React is used to build production diagramming applications across many domains:

| Domain | Examples |
|---|---|
| Workflow & process | Flowchart editors, process automation, activity and sequence diagrams |
| AI workflow builders | Node-based AI pipeline and agent builders, marketing automation studios |
| BPMN | Business process modelers, swimlanes, Visio BPMN import/export |
| Data modeling | ER diagrams, database schema design, data lineage and mapping |
| UML & software modeling | Class, sequence, statechart and use-case diagrams |
| Industrial / SCADA & HMI | SCADA interfaces, HMI control panels, P&ID and process diagrams |
| Energy networks | Power grid and substation diagrams, telecom and fiber (DWDM) network design |
| Electronic design | Circuit and logic design, wiring and cable harness diagrams, schematic capture |
| Org charts | Org charts, reporting hierarchies, team and headcount planning |
| Timelines | Project and milestone timelines, Gantt and PERT charts |

Explore the [demos](https://www.jointjs.com/demos) to see them in action.

## Learn more

- 📖 [Learn JointJS for React](https://docs.jointjs.com/react)
- 🧾 [API reference](https://docs.jointjs.com/api-react)
- 🖼️ [Examples](https://www.jointjs.com/demos)
- 📚 [Storybook](https://react.jointjs.com/learn/)
- 🤖 [MCP server](#using-jointjs-for-react-with-ai-coding-agents)
- 💬 [Ask a question or share feedback](https://github.com/clientIO/joint/discussions)

## Using JointJS for React with AI coding agents

JointJS is built to work well with AI-assisted development.

**MCP server** — connect your AI coding agent (Claude Code, Cursor, and other MCP-compatible tools) to the JointJS Model Context Protocol server so it can search the official docs and demos while you build:

```
https://mcp.jointjs.com/mcp
```

It exposes `search_docs` and `search_demos`, so your agent writes correct JointJS for React code against the real API instead of guessing.

## Commercial version

The open-source library covers core diagramming. **JointJS+ for React** is the commercial extension that takes the end-user experience further with production-ready plugins — stencils, toolbars, snaplines, keyboard shortcuts, undo/redo, advanced layouts, import/export, and more — plus professional demo apps (including source code) and direct support from the team that builds the library. [Start a free 30-day trial.](https://www.jointjs.com/free-trial)

## License

JointJS for React is licensed under the [Mozilla Public License 2.0](https://github.com/clientIO/joint/blob/master/LICENSE).

Copyright © 2013-2026 client IO
