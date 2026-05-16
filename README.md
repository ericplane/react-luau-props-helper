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
out the prop list from the component's own definition — no JSON config
needed in most cases. The definition can live in any `.lua`/`.luau` file
in the workspace; the extension indexes every project file at activation
and watches for changes, so the lookup works whether you're editing the
component itself or a file that `require`s it. Four signals are
recognised, listed from least to most ceremony:

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

### `reactLuauPropsHelper.typeAwareValues`

Default: `true`. When enabled, the inserted snippet includes a value
template for props whose type is known. Examples:

| Prop | Type | Inserted snippet |
| --- | --- | --- |
| `BackgroundColor3` | `Color3` | `BackgroundColor3 = Color3.fromRGB(255, 255, 255),` |
| `Size` | `UDim2` | `Size = UDim2.new(0, 0, 0, 0),` |
| `Interactable` | `boolean` | `Interactable = true|false,` (a toggle picker) |
| `Name` | `string` | `Name = "",` |
| `FontFace` | `Font` | `FontFace = Font.fromName("Montserrat", Enum.FontWeight.Regular),` |
| `HorizontalAlignment` | `Enum.HorizontalAlignment` | `HorizontalAlignment = Enum.HorizontalAlignment.,` |

All tab stops are wired up so you can type values and tab through. Disable
this if you prefer to type values yourself or rely on Copilot's inline
suggestions for the right-hand side.

## Annotation autocomplete

Inside `---@extends ` and `---@prop NAME ` comment lines, the extension
offers context-appropriate suggestions:

- `---@extends ` → all known Roblox classes (`Frame`, `TextLabel`,
  `ScrollingFrame`, `UIListLayout`, …)
- `---@prop NAME ` → common Roblox/Luau types (`Color3`, `UDim2`, `number`,
  `boolean`, `string`, `Font`, `React.ReactNode`, …)

## Editor integrations

The extension also wires up several VS Code APIs that make working with
nested React-Luau trees less painful:

- **Outline panel + breadcrumbs.** Toggle the Outline view from the left
  side, or enable the breadcrumbs bar (`View → Appearance → Show
  Breadcrumbs`). Both show the React tree of the current file
  hierarchically. `Cmd+Shift+O` jumps to any element by name.
- **Inlay hints at `})`.** Each multi-line `e(...)` call gets a small
  ` ▸ Frame (Container)` label at its closing parenthesis so you can
  tell what closed even ten levels deep. Toggle via VS Code's native
  `editor.inlayHints.enabled`.
- **Color preview.** `Color3.fromRGB(...)` and `Color3.new(...)` show a
  swatch in the gutter and open a colour picker on click. The picker
  offers both `fromRGB` and `new` output formats.
- **Hover docs.** Hover any prop name inside an `e(...)` table to see
  its type, the class it was introduced on, and a link to the Roblox
  docs page.
- **`[React.Event.X]` / `[React.Change.X]` completion.** Typing
  `[React.Event.` lists the events available on the enclosing class
  (`Activated`, `MouseEnter`, etc.). `[React.Change.` lists all
  observable properties.
- **Deprecation warnings (default on).** Yellow squigglies under:
  - `Font = Enum.Font.X` — quick-fix replaces with
    `FontFace = Font.fromName(...)` using a built-in family/weight map.
  - `TextColor = …` — likely typo of `TextColor3`; one-click rename
    available.

  Toggle off with `reactLuauPropsHelper.deprecationDiagnostics: false`.
- **Reserved-name warnings (opt-in).** Enable with
  `reactLuauPropsHelper.warnReservedPropNames: true` to be warned when a
  custom component declares a `---@prop` whose name shadows a Roblox
  property of its declared/detected base class.
- **Auto-import (opt-in).** When enabled, `e(GamepassCard, …)` for a
  component the workspace knows about but the current file doesn't
  `require` gets an Information diagnostic with a quick-fix that
  inserts the import at the right spot.

  Configure via `reactLuauPropsHelper.autoImport`:

  ```jsonc
  {
    "reactLuauPropsHelper.autoImport.enabled": true,
    "reactLuauPropsHelper.autoImport.style": "alias",
    "reactLuauPropsHelper.autoImport.aliases": [
      {
        "filesystemPath": "src/Client/UI/Components",
        "robloxPath": "script.Components"
      },
      {
        "filesystemPath": "src/Shared/Packages",
        "robloxPath": "ReplicatedStorage.Packages"
      }
    ]
  }
  ```

  With `"style": "relative"` (default), generated paths look like
  `script.Parent.Components.GamepassCard`.

## Snippets

Built-in snippet prefixes you can type and `Tab`:

| Prefix | Inserts |
| --- | --- |
| `eFrame` | `e("Frame", { … }, { … })` |
| `eTextLabel` / `eTextButton` / `eImageLabel` / `eImageButton` | their respective element |
| `eScrollingFrame` | with `CanvasSize` and `ScrollBarThickness` slots |
| `eUIListLayout` / `eUIGridLayout` / `eUIPadding` / `eUICorner` / `eUIStroke` | the corresponding utility |
| `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback` | hooks |
| `reactEvent` | event handler entry with a `[React.Event.X] = function() … end` skeleton |
| `rfc` | function-component scaffold with a default `return e("Frame", ...)` |

## Known limitations

- **Parsing is text-based, not AST-based.** Strings, comments, and Luau
  block structure are tracked, but pathological inputs (mismatched braces,
  unusual macro/codegen output, type intersections like `Frame & Foo`,
  generics like `Props<T>`) can confuse the detector.
- **Cross-file lookups are name-based.** The workspace index scans every
  `.lua` / `.luau` file and indexes components by their identifier. If
  two files declare a component called `Button`, the first one scanned
  wins. Proper `require`-path resolution is a future enhancement; until
  then, name your components uniquely or pin via
  `reactLuauPropsHelper.props`.
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
