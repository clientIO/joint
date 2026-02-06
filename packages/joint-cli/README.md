# @joint/cli

Command-line tool for [JointJS](https://jointjs.com).

## Quick Start

```bash
npx @joint/cli list
npx @joint/cli download scada/js
```

## Installation

```bash
npm install -g @joint/cli
```

Once installed globally, the `joint` command is available:

```bash
joint list
joint download scada/js
```

## Commands

### `joint list`

List available examples from the [joint-demos](https://github.com/clientIO/joint-demos) repository.

```bash
joint list
```

### `joint download <name> [dest]`

Download an example into the current working directory.

```bash
# Downloads into ./scada-js/
joint download scada/js

# Downloads into ./scada/
joint download scada/js scada

# Downloads into the current directory
joint download scada/js .
```

## Options

| Option | Description |
|---|---|
| `--help`, `-h` | Show help message |
| `--version`, `-v` | Show version number |
| `--owner <name>` | GitHub repo owner (default: `clientIO`) |
| `--branch <name>` | GitHub repo branch (default: `main`) |

### Working with forks

Use `--owner` and `--branch` to list and download examples from a fork:

```bash
joint list --owner myGitHubUser
joint download scada/js --owner myGitHubUser --branch dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `GITHUB_TOKEN` | Optional GitHub token to avoid API rate limiting |

## Requirements

- Node.js >= 22
- Git
