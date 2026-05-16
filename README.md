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

## Configuration

### `reactLuauPropsHelper.props`

Per-class prop list. Each entry **overrides** the built-in defaults for that
class — presence of a key is authoritative, so an explicit empty array
disables completions for that class entirely.

You can also add entries for your own components.

```jsonc
{
  "reactLuauPropsHelper.props": {
    // Override Frame's prop list:
    "Frame": ["Size", "Position", "BackgroundColor3"],

    // Disable suggestions for TextBox:
    "TextBox": [],

    // Add a custom component:
    "MyButton": ["label", "onClick", "disabled"]
  }
}
```

Classes you don't list keep their built-in defaults.

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

- **Brace tracking is text-based, not AST-based.** Strings and comments are
  skipped, but nothing else — pathological inputs (mismatched braces, very
  unusual macro/codegen output) can confuse the detector.
- **Custom components need an entry in `reactLuauPropsHelper.props`** for
  completions to appear. The extension doesn't try to infer their props from
  the surrounding code.
- **Suggestions don't carry type information.** The completion list shows
  prop names only — there's no hover docs for the values.

## Development

```sh
npm install
npm run compile     # one-shot
npm run watch       # rebuild on save
npm test            # run the test suite in a headless VS Code
```

Press **F5** from this folder in VS Code to launch an Extension Development
Host with the extension loaded.
