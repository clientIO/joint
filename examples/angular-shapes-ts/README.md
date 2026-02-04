# JointJS + Angular Example

This example demonstrates how to integrate JointJS with Angular using custom element views that render Angular components inside the views.

## Features

- **Dynamic Angular Components**: Each JointJS element renders a fully functional Angular component
- **Two-way Binding**: Changes in the Angular component update the JointJS model
- **Component Inputs/Outputs**: Full support for Angular's input/output decorators
- **Change Detection**: Components are properly attached to Angular's change detection
- **Clean Lifecycle**: Components are destroyed when elements are removed
- **Selection with Highlighters**: UI state like selection is managed separately from data

## Project Structure

```
src/
├── main.ts                           # Angular bootstrap
├── styles.css                        # Global styles
├── index.html                        # HTML entry point
└── app/
    ├── app.component.ts              # Main component with JointJS setup
    ├── app.component.html            # Main component template
    ├── app.component.css             # Main component styles
    ├── components/
    │   ├── element.component.ts      # Angular component rendered in views
    │   ├── element.component.html    # Element component template
    │   └── element.component.css     # Element component styles
    ├── models/
    │   ├── angular-element.ts        # Custom JointJS element model
    │   └── link.ts                   # Custom JointJS link model
    └── views/
        └── angular-element-view.ts   # Custom JointJS view using createComponent
```

## Running the Example

```bash
# Install dependencies
yarn install

# Start development server
yarn start
```

Navigate to `http://localhost:4200/` in your browser.

## Requirements

- Angular 19+
- JointJS @joint/core

## Tutorial

For a detailed step-by-step guide on how this integration works, see **[TUTORIAL.md](./TUTORIAL.md)**.

The tutorial covers:
- Creating Angular components for use in JointJS views
- Building a custom `ElementView` with `foreignObject` and `createComponent()`
- Setting up presentation attributes for model change detection
- Defining element models with typed attributes
- Configuring the Paper with custom views
- Managing selection state with highlighters
