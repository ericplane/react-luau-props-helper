# Change Log

All notable changes to the "react-luau-props-helper" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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
