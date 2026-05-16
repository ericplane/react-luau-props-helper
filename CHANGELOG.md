# Change Log

All notable changes to the "react-luau-props-helper" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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
