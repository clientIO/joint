# joint-plus-tutorial-vue

This git repository is intended for instructional purposes. It is the source code that accompanies a JointJS+ blog post "Integration with Vue" which can be found [here](https://resources.jointjs.com/tutorial/vue-ts).

### Prerequisites  

To run the following code, you will need a [JointJS+ license](https://www.jointjs.com/license) that comes with the JointJS+ installable package file `joint-plus.tgz`.

### Dependencies

Make sure you have the following dependencies installed on your system:

- [Node.js >= 16.0](https://nodejs.org/en/)
- git

#### Setup

Clone this repository.

```
git clone git@github.com:clientIO/joint-plus-tutorial-vue.git
```

Change into the `joint-plus-tutorial-vue` directory.

```
cd joint-plus-tutorial-vue
```

For this tutorial, you need to place your own `joint-plus.tgz` file in the root directory.

When that is completed, you can install the dependencies.

```
npm install
```

Your demo is now ready to start.

```
npm run dev
```

You should be able to view the demo at `http://localhost:5173/`.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.
