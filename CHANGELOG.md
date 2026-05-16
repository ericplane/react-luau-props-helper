# Change Log

All notable changes to the "react-luau-props-helper" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.5.5]

### Added

- `reactLuauPropsHelper.colorPreview.enabled` (default `true`) — disable
  our `Color3` color picker if another extension (e.g. a Roblox API
  extension) is already providing one and you're seeing duplicates.

## [1.5.4]

### Changed

- **Performance pass.** Caches added for the expensive pure helpers that
  every provider hits on every keystroke:
  - `buildCodeMask` + `applyMask` share a small LRU keyed by text. Each
    document is masked at most once per version, even though half a dozen
    providers want at it.
  - `findAllCreateElementCalls` is memoised per `(text, aliases)`. Inlay
    hints and document symbols both consume this, often back-to-back —
    one parse now serves both.
  - `scanDocument`'s 1-entry cache expanded to a 4-entry LRU so opening
    the hover provider for one file doesn't evict the scan of another
    file you're hovering through.
  - `buildAliasAlternation` is memoised — the regex no longer re-escapes
    and sorts its inputs on every call.
  - `flattenClassProps` and `flattenClassEvents` are memoised — the class
    hierarchy is static, so each class's inherited list is computed once
    for the lifetime of the extension.
- No behavioural changes — all 100 tests still pass.

## [1.5.3]

### Changed

- Internal: `extension.ts` was 3200+ lines and getting unwieldy. Split
  into focused modules — `data.ts` (constants/hierarchy), `parser.ts`
  (pure parsing), `config.ts`, `workspaceIndex.ts`, `completion.ts`
  (completion providers + resolution), `editor.ts` (color, hover, inlay,
  symbols), `diagnostics.ts`, `codeActions.ts`. No behaviour changes —
  all 100 tests still pass.

## [1.5.2]

### Changed

- Inlay hints default to `scope: "ancestors"` instead of `"all"`. Hints
  now appear only for the call containing the cursor and its ancestor
  chain, so the file stays clean except where you're actively working.
  Flip back to `"all"` via `reactLuauPropsHelper.inlayHints.scope` if
  you preferred the always-on style.
- Inlay hints default to `position: "after-comma"` instead of
  `"before-comma"`. The label now sits *past* the trailing `,`, leaving
  `})` and the comma tight against each other.

## [1.5.1]

### Added

- `reactLuauPropsHelper.documentSymbols.enabled` (default `true`) —
  toggle the React-tree Outline / breadcrumbs / "Go to Symbol" contribution
  without disabling the whole extension.
- `reactLuauPropsHelper.inlayHints.enabled` (default `true`) — toggle
  this extension's inlay hints independently of VS Code's master toggle.
- `reactLuauPropsHelper.inlayHints.scope` (`"all"` / `"ancestors"`,
  default `"all"`) — when set to `"ancestors"`, inlay hints only appear
  for calls that contain the cursor. Move the cursor into a nested
  element and the surrounding ancestors' labels light up; the rest of
  the file stays clean.
- `reactLuauPropsHelper.inlayHints.position` (`"before-comma"` /
  `"after-comma"`, default `"before-comma"`) — controls where the label
  lands relative to the trailing `,` that separates sibling children.

## [1.5.0]

### Added

- **Inlay hints at closing brackets.** Every multi-line `e(...)` call
  gets a small ` ▸ Frame (Container)` label at its `)`, so you can tell
  at a glance which element you just closed. Toggle via VS Code's native
  `editor.inlayHints.enabled` setting.
- **Document symbols / Outline / Breadcrumbs.** The Outline panel,
  breadcrumbs bar, and `Cmd+Shift+O` (Go to Symbol in File) now reflect
  the React tree of the current document, hierarchically. Components
  named via the `Name` prop are labelled with that name.
- **Color preview.** `Color3.fromRGB(...)` and `Color3.new(...)` values
  render a colour swatch in the gutter and open VS Code's colour picker
  when clicked. The picker offers both `fromRGB` and `new` output formats.
- **Hover documentation.** Hovering any prop name inside an `e(...)`
  props table shows its type, the class it was introduced on, and a
  link to the Roblox docs page.
- **`[React.Event.X]` and `[React.Change.X]` completion.** Typing
  `[React.Event.` opens a picker of events for the enclosing class
  (`Activated`, `MouseEnter`, etc.); `[React.Change.` lists properties.
- **Deprecation diagnostics + quick-fixes** (on by default):
  - `Font = Enum.Font.X` → "Font is deprecated, prefer FontFace" with a
    quick-fix that replaces it with `FontFace = Font.fromName(...)`
    using a built-in family/weight map.
  - `TextColor = …` (missing the trailing `3`) → "Did you mean
    TextColor3?" with a one-click rename quick-fix.
  - Toggle with `reactLuauPropsHelper.deprecationDiagnostics`.
- **Reserved-name diagnostic** (opt-in via
  `reactLuauPropsHelper.warnReservedPropNames`). When a component
  declares `---@prop Name string` and inherits/extends a Roblox class
  whose own `Name` would conflict, surface a warning.
- **Auto-import (opt-in)** — when enabled, `e(GamepassCard, ...)` with
  no local `require` for it shows an Information diagnostic and a
  quick-fix that inserts the import. Two path styles:
  - `relative` — generates `script.Parent…X` chains from the current
    file's location.
  - `alias` — uses user-configured filesystem→Roblox prefix mappings
    (e.g. `src/Client/UI/Components` → `script.Components`).
- **Built-in snippets**: `eFrame`, `eTextLabel`, `eTextButton`,
  `eImageLabel`, `eImageButton`, `eScrollingFrame`, `eUIListLayout`,
  `eUIGridLayout`, `eUIPadding`, `eUICorner`, `eUIStroke`,
  `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`,
  `reactEvent` (event handler), and `rfc` (component scaffold).
- Class hierarchy now exposes events too, inherited the same way props
  are (`GuiObject` → `GuiButton` → `TextButton/ImageButton`;
  `TextBox.events` for focus/text-change).

### Settings added

- `reactLuauPropsHelper.warnReservedPropNames` (default `false`)
- `reactLuauPropsHelper.deprecationDiagnostics` (default `true`)
- `reactLuauPropsHelper.autoImport.enabled` (default `false`)
- `reactLuauPropsHelper.autoImport.style` (`relative` | `alias`)
- `reactLuauPropsHelper.autoImport.aliases` (array of
  `{ filesystemPath, robloxPath }`)

## [1.4.0]

### Added

- **Modern Roblox prop defaults.** Built-in lists now include
  `Interactable`, `Active`, `Selectable`, `NextSelection*`, `AutoLocalize`,
  `FontFace`, `Wraps`, `HorizontalFlex` / `VerticalFlex`, `ElasticBehavior`,
  `ScrollBarImageColor3`, `MaxVisibleGraphemes`, `TextDirection`, and many
  more. New utility classes covered: `UIAspectRatioConstraint`,
  `UIFlexItem`, `UISizeConstraint`, `UITextSizeConstraint`, `UIScale`,
  `UITableLayout`, plus `BillboardGui`, `SurfaceGui`, `VideoFrame`.
- Defaults are now built from a **class hierarchy** (`Instance` →
  `GuiBase2d` → `GuiObject` → concrete classes; `UILayout` for the layout
  family) instead of flat lists. Adding a prop to `GuiObject` once
  propagates to every Frame-family / Text-family / Image-family class.
- **Type-aware value snippets.** When the prop's type is recognised
  (`BackgroundColor3` → `Color3`, `Size` → `UDim2`, `Interactable` →
  `boolean`, …) the inserted snippet now includes a value template with
  tab stops, e.g. `BackgroundColor3 = Color3.fromRGB(${1:255}, ${2:255}, ${3:255})`.
  Controlled by the new `reactLuauPropsHelper.typeAwareValues` setting
  (default `true`).
- **Annotation completion.** Typing inside a `---@extends ` or
  `---@prop NAME ` comment line opens a suggest widget with Roblox class
  names (for `@extends`) or Roblox/Luau types like `Color3`, `UDim2`,
  `number`, `boolean`, … (for `@prop`).
- Completion items now show the prop's type in the detail text
  (`Frame property — Color3`).

### Notes

- The `boolean` snippet uses VS Code's choice element
  (`${1|true,false|}`), so accepting the completion drops you onto a
  toggleable true/false picker.
- For `Enum.*` types, the template is `Enum.<X>.${1}` — type the value
  name (e.g. `Center`) and tab past.

## [1.3.0]

### Added

- **Cross-file component inference.** The extension now indexes every
  `.lua` / `.luau` file in the workspace at activation, watches for changes,
  and looks up component definitions across the whole project. Means a
  `GamepassCard` defined in its own module is recognised when used as
  `e(GamepassCard, { ... })` from any other file — auto-detection,
  `---@extends`, `---@prop`, and typed-signature inference all work
  cross-file.
- File-system watcher keeps the index live as files are created, modified,
  or deleted.
- Unsaved buffer changes are reflected in the index immediately (via
  `onDidChangeTextDocument`), so completions stay fresh while you edit.
- Changes to `reactLuauPropsHelper.createElementAliases` invalidate the
  workspace index automatically.

### Changed

- `provideCompletionItems` is now async. First completion after activation
  may wait briefly on workspace warmup; subsequent completions are
  instantaneous.
- When the current file *also* declares the component being looked up, the
  same-file definition wins over a workspace match (locality).

### Known limitations

- Lookups are name-based: if two files declare a component with the same
  identifier, the first one indexed wins. Proper `require`-path resolution
  is a future enhancement.

## [1.2.0]

### Added

- **Auto-detection from a component's root element.** When a function
  component returns `e("Frame", ...)` (or any other class) at the top, the
  extension now offers that class's props automatically when the component
  is used — no config needed for the common "this is basically a Frame +"
  case.
- **`---@extends ClassName` and `---@prop name [type]` annotations.**
  Lua-LS-style triple-dash comments above a function declaration. Read by
  this extension, ignored as a regular comment by every other tool. Lets
  you declare the contract once, next to the component.
- **Typed-signature inference.** A `props: { foo, bar }` parameter — or
  `props: SomeTypeAlias` resolved to a same-file `type SomeTypeAlias = { ... }`
  — provides prop suggestions automatically.
- **Object form for `reactLuauPropsHelper.props`.** Entries can now be
  `{ "extends": "Frame", "props": ["customProp"] }` to inherit from a base
  class and append extras. The legacy array form continues to work.
- Recursive `extends` resolution with cycle protection (depth ≤ 8).

### Known limitations

- In-file inference is single-file: prop types defined in `require`d
  modules aren't followed.
- Type intersections (`Frame & MyProps`) and generics (`Props<T>`) are not
  parsed.
- The first top-level `return e("X", ...)` wins for auto-detection;
  conditional returns aren't merged.

## [1.1.0]

### Fixed

- **Tab no longer steals from GitHub Copilot.** Dropped `" "` and `"\n"` as
  completion trigger characters; the suggest widget no longer pops up every
  time you press space or newline.
- **Garbled inserts like `BackgroundColor3 = BackgroundColor 3`.** Completion
  items now carry an explicit replace range, so the snippet cleanly replaces
  the partial word under the cursor.
- **Wrong class detected after a closed child.** The provider now finds the
  *actually-enclosing* `createElement` call by walking braces backward from
  the cursor, instead of taking the last regex match in the lookback window.
- **Braces inside strings and comments** no longer affect detection.
- **Identifier-suffix false positives** (`frame("X", {`, `case("X", {`, etc.)
  no longer match the bare `e` alias — a proper word boundary is enforced.
- Removed the arbitrary 2000-char lookback limit. Detection now works
  regardless of how deep the call is nested.

### Added

- `reactLuauPropsHelper.createElementAliases` setting for adding custom
  `createElement` aliases (e.g. `"r"` if you use `local r = React.createElement`).
- `reactLuauPropsHelper.snippetMode` setting (`value-with-comma`, `value`,
  `name-only`).
- Support for completions on custom components — add `"MyButton": [...]` to
  `reactLuauPropsHelper.props` and the suggestions appear for `e(MyButton, {`.
- Empty array (`[]`) in `reactLuauPropsHelper.props` now explicitly disables
  a class's completions.
- Completion items now carry `sortText`, `filterText`, and `documentation`.
- Real fixture-based unit tests for the detection logic.

### Changed

- Default for `reactLuauPropsHelper.props` is now `{}`. Built-in defaults
  live inside the extension and merge in for any class you don't override.

## [1.0.0]

- Initial release.
