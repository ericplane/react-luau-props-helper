# React Luau Props Helper

VS Code extension that adds context-aware IntelliSense for React-Luau
`createElement` calls.

When you type:

```lua
local React = require(ReplicatedStorage.Packages.React)
local e = React.createElement

e("TextLabel", {
    -- start typing here
})
```

…the suggest widget offers `Text`, `TextColor3`, `BackgroundColor3`, etc.,
scoped to the class you passed as the first argument.

## Supported call shapes

The extension recognises several common spellings of `createElement`:

- `e(...)` — the conventional short alias
- `createElement(...)`
- `React.createElement(...)`
- `Roact.createElement(...)`

You can add your own via the `reactLuauPropsHelper.createElementAliases`
setting.

The first argument can be either a string (`"TextLabel"`) or an identifier
(`MyButton`, `Components.Button`).

## Custom components

For custom function components like `GamepassCard`, the extension figures
out the prop list from in-file signals — no JSON config needed in most
cases. Four signals are recognised, listed from least to most ceremony:

### 1. Auto-detection from the component's root element

If your component returns `e("ClassName", { ... })` at the top, completions
for `e(YourComponent, { ... })` will offer that class's props automatically:

```lua
local function GamepassCard(props): React.ReactNode
    return e("Frame", {
        Size = UDim2.new(0.5, -6, 0, 170),
        ...
    })
end

-- Elsewhere:
e(GamepassCard, {
    -- Frame's props (BackgroundColor3, Size, …) appear here.
})
```

> **Caveat — suggesting ≠ forwarding.** A suggested prop only takes effect
> if your component actually forwards it. The example above hardcodes all
> the Frame props, so writing `BackgroundColor3 = …` at the call site would
> silently do nothing. You'd need to merge `props` into the inner table,
> e.g. with [`table.clone`](https://create.roblox.com/docs/reference/engine/libraries/table) or a
> dictionary-join helper. The extension shows what your component *could*
> accept; making it actually accept those props is on you.

### 2. `---@extends` / `---@prop` annotations

A Lua-LS-style triple-dash comment above the function declares the prop
contract explicitly. Other tooling (Lua-LS, stylua) treats it as a regular
comment.

```lua
---@extends Frame
---@prop gamepassId number
---@prop layoutOrder number?
local function GamepassCard(props): React.ReactNode
    return e("Frame", { ... })
end
```

Annotations override auto-detection. Use `---@extends` to declare a base
class different from the visual root, or to be explicit when the function
returns multiple things via `if/else`.

### 3. Typed `props` parameter

If you give `props` a type — inline or via a same-file `type` alias — the
field names are extracted automatically:

```lua
-- Inline literal:
local function GamepassCard(props: { gamepassId: number, layoutOrder: number? })
    ...
end

-- Or with a type alias:
type GamepassCardProps = {
    gamepassId: number,
    layoutOrder: number?,
}

local function GamepassCard(props: GamepassCardProps): React.ReactNode
    ...
end
```

Combine with `---@extends` for "Frame plus these":

```lua
---@extends Frame
local function GamepassCard(props: { gamepassId: number })
    ...
end
```

### 4. Central JSON config

For components defined in files the extension can't reach, or when you
want to override everything from one place, use
`reactLuauPropsHelper.props` (see below).

## Configuration

### `reactLuauPropsHelper.props`

Per-class prop list. Each entry **overrides** the built-in defaults for that
class — presence of a key is authoritative, so an explicit empty array
disables completions for that class entirely. Two shapes are accepted:

```jsonc
{
  "reactLuauPropsHelper.props": {
    // Array form — just the prop list.
    "Frame": ["Size", "Position", "BackgroundColor3"],

    // Empty array disables this class.
    "TextBox": [],

    // Array form for a custom component.
    "MyButton": ["label", "onClick", "disabled"],

    // Object form — inherit from a base class and add extras.
    "GamepassCard": {
      "extends": "Frame",
      "props": ["gamepassId", "layoutOrder"]
    }
  }
}
```

Classes you don't list keep their built-in defaults. For most custom
components you won't need this section at all — the in-file inference
described under [Custom components](#custom-components) handles them.

### `reactLuauPropsHelper.createElementAliases`

Function names treated as `createElement`. Each entry must be a Lua
identifier (dots allowed).

```jsonc
{
  "reactLuauPropsHelper.createElementAliases": [
    "e",
    "createElement",
    "React.createElement",
    "Roact.createElement",
    "r" // your own alias
  ]
}
```

### `reactLuauPropsHelper.snippetMode`

Controls what gets inserted when you accept a completion:

| Value | Inserts |
| --- | --- |
| `value-with-comma` *(default)* | `Name = $1,$0` — cursor at value, tab lands after the comma |
| `value` | `Name = $0` |
| `name-only` | `Name` |

## Known limitations

- **Parsing is text-based, not AST-based.** Strings, comments, and Luau
  block structure are tracked, but pathological inputs (mismatched braces,
  unusual macro/codegen output, type intersections like `Frame & Foo`,
  generics like `Props<T>`) can confuse the detector.
- **Single-file scope.** In-file inference doesn't follow `require()` — if
  your component's prop type lives in another file, fall back to
  `---@extends` / `---@prop` annotations or central JSON config.
- **First top-level return wins.** Components that conditionally return
  different element classes have the first one taken as the implicit base.
- **Suggesting ≠ forwarding.** See the caveat under
  [Custom components](#custom-components).
- **Suggestions don't carry type information.** The completion list shows
  prop names only — no hover docs for value types.

## Development

```sh
npm install
npm run compile     # one-shot
npm run watch       # rebuild on save
npm test            # run the test suite in a headless VS Code
```

Press **F5** from this folder in VS Code to launch an Extension Development
Host with the extension loaded.
