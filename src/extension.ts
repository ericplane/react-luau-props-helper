import * as vscode from "vscode";

// Built-in defaults. Used when no user entry exists for a class. A user can
// override (or disable, via empty array) any of these via the
// `reactLuauPropsHelper.props` setting.
const defaultPropsMap: Record<string, string[]> = {
  ScreenGui: [
    "Enabled",
    "IgnoreGuiInset",
    "ResetOnSpawn",
    "DisplayOrder",
    "ZIndexBehavior",
  ],

  Frame: [
    "BackgroundColor3",
    "BackgroundTransparency",
    "BorderSizePixel",
    "BorderColor3",
    "AnchorPoint",
    "Position",
    "Size",
    "AutomaticSize",
    "Visible",
    "ZIndex",
    "LayoutOrder",
    "ClipsDescendants",
    "Rotation",
  ],

  ScrollingFrame: [
    "BackgroundColor3",
    "BackgroundTransparency",
    "BorderSizePixel",
    "BorderColor3",
    "AnchorPoint",
    "Position",
    "Size",
    "AutomaticSize",
    "Visible",
    "ZIndex",
    "LayoutOrder",
    "ClipsDescendants",
    "CanvasSize",
    "CanvasPosition",
    "AutomaticCanvasSize",
    "ScrollBarThickness",
    "ScrollingDirection",
    "ScrollingEnabled",
    "BottomImage",
    "MidImage",
    "TopImage",
  ],

  TextLabel: [
    "Text",
    "TextColor3",
    "TextTransparency",
    "TextStrokeColor3",
    "TextStrokeTransparency",
    "Font",
    "TextSize",
    "RichText",
    "TextWrapped",
    "TextTruncate",
    "TextScaled",
    "LineHeight",
    "TextXAlignment",
    "TextYAlignment",
    "BackgroundColor3",
    "BackgroundTransparency",
    "BorderSizePixel",
    "BorderColor3",
    "AnchorPoint",
    "Position",
    "Size",
    "AutomaticSize",
    "Visible",
    "ZIndex",
    "LayoutOrder",
    "ClipsDescendants",
    "Rotation",
  ],

  TextButton: [
    "Text",
    "TextColor3",
    "TextTransparency",
    "TextStrokeColor3",
    "TextStrokeTransparency",
    "Font",
    "TextSize",
    "RichText",
    "TextWrapped",
    "TextTruncate",
    "TextScaled",
    "LineHeight",
    "TextXAlignment",
    "TextYAlignment",
    "AutoButtonColor",
    "Modal",
    "Selected",
    "BackgroundColor3",
    "BackgroundTransparency",
    "BorderSizePixel",
    "BorderColor3",
    "AnchorPoint",
    "Position",
    "Size",
    "AutomaticSize",
    "Visible",
    "ZIndex",
    "LayoutOrder",
    "ClipsDescendants",
    "Rotation",
  ],

  TextBox: [
    "Text",
    "PlaceholderText",
    "ClearTextOnFocus",
    "TextColor3",
    "TextTransparency",
    "TextStrokeColor3",
    "TextStrokeTransparency",
    "Font",
    "TextSize",
    "RichText",
    "TextWrapped",
    "MultiLine",
    "CursorPosition",
    "SelectionStart",
    "ShowNativeInput",
    "TextXAlignment",
    "TextYAlignment",
    "BackgroundColor3",
    "BackgroundTransparency",
    "BorderSizePixel",
    "BorderColor3",
    "AnchorPoint",
    "Position",
    "Size",
    "AutomaticSize",
    "Visible",
    "ZIndex",
    "LayoutOrder",
    "ClipsDescendants",
    "Rotation",
  ],

  ImageLabel: [
    "Image",
    "ImageColor3",
    "ImageTransparency",
    "ImageRectOffset",
    "ImageRectSize",
    "ScaleType",
    "SliceCenter",
    "SliceScale",
    "ResampleMode",
    "BackgroundColor3",
    "BackgroundTransparency",
    "BorderSizePixel",
    "BorderColor3",
    "AnchorPoint",
    "Position",
    "Size",
    "AutomaticSize",
    "Visible",
    "ZIndex",
    "LayoutOrder",
    "ClipsDescendants",
    "Rotation",
  ],

  ImageButton: [
    "Image",
    "ImageColor3",
    "ImageTransparency",
    "ImageRectOffset",
    "ImageRectSize",
    "ScaleType",
    "SliceCenter",
    "SliceScale",
    "ResampleMode",
    "AutoButtonColor",
    "Modal",
    "Selected",
    "BackgroundColor3",
    "BackgroundTransparency",
    "BorderSizePixel",
    "BorderColor3",
    "AnchorPoint",
    "Position",
    "Size",
    "AutomaticSize",
    "Visible",
    "ZIndex",
    "LayoutOrder",
    "ClipsDescendants",
    "Rotation",
  ],

  ViewportFrame: [
    "CurrentCamera",
    "Ambient",
    "LightColor",
    "LightDirection",
    "ImageTransparency",
    "BackgroundColor3",
    "BackgroundTransparency",
    "BorderSizePixel",
    "BorderColor3",
    "AnchorPoint",
    "Position",
    "Size",
    "AutomaticSize",
    "Visible",
    "ZIndex",
    "LayoutOrder",
    "ClipsDescendants",
    "Rotation",
  ],

  CanvasGroup: ["GroupTransparency", "GroupColor3"],

  UIStroke: [
    "Color",
    "Thickness",
    "Transparency",
    "ApplyStrokeMode",
    "LineJoinMode",
    "Enabled",
  ],

  UICorner: ["CornerRadius", "Enabled"],

  UIPadding: ["PaddingTop", "PaddingBottom", "PaddingLeft", "PaddingRight"],

  UIListLayout: [
    "FillDirection",
    "Padding",
    "HorizontalAlignment",
    "VerticalAlignment",
    "SortOrder",
    "ItemLineAlignment",
  ],

  UIGridLayout: [
    "CellSize",
    "CellPadding",
    "FillDirection",
    "FillDirectionMaxCells",
    "HorizontalAlignment",
    "VerticalAlignment",
    "SortOrder",
    "StartCorner",
  ],

  UIPageLayout: [
    "Animated",
    "Circular",
    "EasingDirection",
    "EasingStyle",
    "FillDirection",
    "Padding",
    "PageSize",
    "ScrollWheelInputEnabled",
    "TouchInputEnabled",
    "GamepadInputEnabled",
    "HorizontalAlignment",
    "VerticalAlignment",
  ],

  UIGradient: ["Color", "Transparency", "Offset", "Rotation", "Enabled"],
};

const DEFAULT_ALIASES = [
  "e",
  "createElement",
  "React.createElement",
  "Roact.createElement",
];

export function activate(context: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = [
    { language: "lua", scheme: "file" },
    { language: "luau", scheme: "file" },
  ];

  // No trigger characters: VS Code already fires completion as the user types
  // identifier characters. Registering space/newline as triggers caused the
  // suggest widget to steal Tab from GitHub Copilot's inline ghost text.
  const provider = vscode.languages.registerCompletionItemProvider(
    selector,
    new ReactLuauPropsCompletionProvider()
  );

  context.subscriptions.push(provider);
}

export function deactivate() {}

class ReactLuauPropsCompletionProvider
  implements vscode.CompletionItemProvider
{
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    const text = document.getText();
    const cursorOffset = document.offsetAt(position);

    const detected = findEnclosingPropsCall(text, cursorOffset, getAliases());
    if (!detected) {
      return undefined;
    }

    const props = getPropsForClass(detected.className, document);
    if (!props || props.length === 0) {
      return undefined;
    }

    const wordRange = document.getWordRangeAtPosition(
      position,
      /[A-Za-z_][A-Za-z0-9_]*/
    );

    return buildItemsForProps(detected.className, props, wordRange);
  }
}

function getAliases(): string[] {
  const config = vscode.workspace.getConfiguration("reactLuauPropsHelper");
  const fromConfig = config.get<string[]>(
    "createElementAliases",
    DEFAULT_ALIASES
  );
  if (!Array.isArray(fromConfig) || fromConfig.length === 0) {
    return DEFAULT_ALIASES;
  }
  return fromConfig;
}

type UserPropsEntry = string[] | { extends?: string; props?: string[] };

function getPropsForClass(
  className: string,
  document?: vscode.TextDocument
): string[] | undefined {
  const config = vscode.workspace.getConfiguration("reactLuauPropsHelper");
  const userMap =
    config.get<Record<string, UserPropsEntry>>("props", {}) ?? {};
  const aliases = getAliases();
  return resolveProps(className, userMap, document, aliases, new Set(), 0);
}

function resolveProps(
  className: string,
  userMap: Record<string, UserPropsEntry>,
  document: vscode.TextDocument | undefined,
  aliases: string[],
  visited: Set<string>,
  depth: number
): string[] | undefined {
  if (depth > 8 || visited.has(className)) {
    return undefined;
  }
  visited.add(className);

  // 1. User config wins outright.
  if (Object.prototype.hasOwnProperty.call(userMap, className)) {
    return resolveUserEntry(
      userMap[className],
      userMap,
      document,
      aliases,
      visited,
      depth
    );
  }

  // 2. Built-in defaults win outright.
  if (defaultPropsMap[className]) {
    return defaultPropsMap[className];
  }

  // 3. Custom component: merge in-file sources.
  if (!document) {
    return undefined;
  }

  const info = scanDocument(document.getText(), aliases).get(className);
  if (!info) {
    return undefined;
  }

  const merged: string[] = [];
  pushUnique(merged, info.annotations.props);
  pushUnique(merged, info.paramTypeFields ?? []);
  const base = info.annotations.extendsClass ?? info.detectedBase;
  if (base) {
    const baseProps = resolveProps(
      base,
      userMap,
      document,
      aliases,
      visited,
      depth + 1
    );
    if (baseProps) {
      pushUnique(merged, baseProps);
    }
  }
  return merged.length > 0 ? merged : undefined;
}

function resolveUserEntry(
  entry: UserPropsEntry,
  userMap: Record<string, UserPropsEntry>,
  document: vscode.TextDocument | undefined,
  aliases: string[],
  visited: Set<string>,
  depth: number
): string[] | undefined {
  if (Array.isArray(entry)) {
    // Legacy array form. Empty array disables; we still return it so the
    // caller can short-circuit.
    return entry.filter((x): x is string => typeof x === "string");
  }
  if (entry && typeof entry === "object") {
    const merged: string[] = [];
    if (Array.isArray(entry.props)) {
      pushUnique(
        merged,
        entry.props.filter((x): x is string => typeof x === "string")
      );
    }
    if (typeof entry.extends === "string") {
      const baseProps = resolveProps(
        entry.extends,
        userMap,
        document,
        aliases,
        visited,
        depth + 1
      );
      if (baseProps) {
        pushUnique(merged, baseProps);
      }
    }
    return merged;
  }
  return undefined;
}

function pushUnique(target: string[], items: string[]): void {
  for (const item of items) {
    if (!target.includes(item)) {
      target.push(item);
    }
  }
}

function buildItemsForProps(
  className: string,
  props: string[],
  range: vscode.Range | undefined
): vscode.CompletionItem[] {
  const config = vscode.workspace.getConfiguration("reactLuauPropsHelper");
  const snippetMode = config.get<string>("snippetMode", "value-with-comma");

  return props.map((name, index) => {
    const item = new vscode.CompletionItem(
      name,
      vscode.CompletionItemKind.Property
    );
    item.insertText = buildSnippet(name, snippetMode);
    item.detail = `${className} property`;
    item.documentation = new vscode.MarkdownString(
      `\`${className}.${name}\` — suggested by React Luau Props Helper.`
    );
    item.filterText = name;
    // Preserve declared order; pad to keep stable sort across props lists.
    item.sortText = String(index).padStart(4, "0");
    if (range) {
      item.range = range;
    }
    return item;
  });
}

function buildSnippet(name: string, mode: string): vscode.SnippetString {
  switch (mode) {
    case "name-only":
      return new vscode.SnippetString(name);
    case "value":
      return new vscode.SnippetString(`${name} = $0`);
    case "value-with-comma":
    default:
      return new vscode.SnippetString(`${name} = $1,$0`);
  }
}

// ============================================================================
// Detection helpers (pure; exported for unit tests).
// ============================================================================

export interface EnclosingCall {
  className: string;
  isStringLiteralName: boolean;
}

/**
 * Build a per-character bitmap where `true` means the character is *code*
 * (not inside a Lua string or comment). Quotes/comment delimiters are kept
 * as code so that downstream regexes can still see them.
 */
export function buildCodeMask(text: string): boolean[] {
  const mask = new Array<boolean>(text.length).fill(true);
  let i = 0;

  while (i < text.length) {
    const c = text[i];

    // Comments: `--`, `--[[ ... ]]`, `--[=*[ ... ]=*]`
    if (c === "-" && text[i + 1] === "-") {
      const blockMatch = /^\[(=*)\[/.exec(text.slice(i + 2));
      if (blockMatch) {
        const level = blockMatch[1].length;
        const closeStr = "]" + "=".repeat(level) + "]";
        const searchFrom = i + 2 + blockMatch[0].length;
        const closeIdx = text.indexOf(closeStr, searchFrom);
        const endIdx = closeIdx === -1 ? text.length : closeIdx + closeStr.length;
        for (let j = i; j < endIdx; j++) {
          mask[j] = false;
        }
        i = endIdx;
        continue;
      }
      while (i < text.length && text[i] !== "\n") {
        mask[i] = false;
        i++;
      }
      continue;
    }

    // Quoted strings: keep the quotes as code so a later regex can spot
    // them; mask the interior only.
    if (c === '"' || c === "'") {
      const quote = c;
      i++;
      while (i < text.length) {
        if (text[i] === "\\" && i + 1 < text.length) {
          mask[i] = false;
          if (text[i + 1] !== "\n") {
            mask[i + 1] = false;
          }
          i += 2;
          continue;
        }
        if (text[i] === quote) {
          i++;
          break;
        }
        if (text[i] === "\n") {
          // Unterminated string: stop masking at end-of-line.
          break;
        }
        mask[i] = false;
        i++;
      }
      continue;
    }

    // Long-bracket strings: `[[ ... ]]` / `[=*[ ... ]=*]`. Keep delimiters as
    // code; mask only the interior.
    if (c === "[") {
      const longMatch = /^\[(=*)\[/.exec(text.slice(i));
      if (longMatch) {
        const level = longMatch[1].length;
        const closeStr = "]" + "=".repeat(level) + "]";
        const innerStart = i + longMatch[0].length;
        const closeIdx = text.indexOf(closeStr, innerStart);
        const innerEnd = closeIdx === -1 ? text.length : closeIdx;
        for (let j = innerStart; j < innerEnd; j++) {
          mask[j] = false;
        }
        i = closeIdx === -1 ? text.length : closeIdx + closeStr.length;
        continue;
      }
    }

    i++;
  }

  return mask;
}

/**
 * Walk backward from the cursor to find the `{` of the immediately enclosing
 * block. If that block opens a createElement-style props table, return the
 * class/component name. Otherwise return undefined.
 */
export function findEnclosingPropsCall(
  text: string,
  cursorIndex: number,
  aliases: string[]
): EnclosingCall | undefined {
  const mask = buildCodeMask(text);

  let braceDepth = 0;
  let parenDepth = 0;
  let openBraceIdx = -1;

  for (let i = cursorIndex - 1; i >= 0; i--) {
    if (!mask[i]) {
      continue;
    }
    const c = text[i];
    if (c === "}") {
      braceDepth++;
    } else if (c === "{") {
      if (braceDepth === 0) {
        // If we're inside an unmatched `(`, the cursor is in an expression,
        // not directly in the props object — skip.
        if (parenDepth < 0) {
          return undefined;
        }
        openBraceIdx = i;
        break;
      }
      braceDepth--;
    } else if (c === ")") {
      parenDepth++;
    } else if (c === "(") {
      parenDepth--;
    }
  }

  if (openBraceIdx === -1) {
    return undefined;
  }

  const aliasPattern = buildAliasAlternation(aliases);

  // The function-call header lives in a small window before the `{`. Limit
  // the slice so the regex engine doesn't churn through huge files.
  const sliceStart = Math.max(0, openBraceIdx - 500);
  const before = text.slice(sliceStart, openBraceIdx);

  // (?:^|[^A-Za-z0-9_.]) — guard so `e` isn't matched inside identifiers
  //   like `frame`, `case`, `Recipe`, etc.
  // (?:alias) — one of the configured createElement aliases.
  // \s*\(\s* — open paren.
  // first arg — quoted string ("X" or 'X') OR dotted identifier (X / X.Y).
  // \s*,\s* — comma separator.
  // $ — end of slice (i.e., right before the `{` we found).
  const pattern = new RegExp(
    `(?:^|[^A-Za-z0-9_.])(?:${aliasPattern})\\s*\\(\\s*` +
      `(?:"([A-Za-z_][A-Za-z0-9_]*)"|'([A-Za-z_][A-Za-z0-9_]*)'|` +
      `([A-Za-z_][A-Za-z0-9_]*(?:\\.[A-Za-z_][A-Za-z0-9_]*)*))` +
      `\\s*,\\s*$`
  );

  const match = pattern.exec(before);
  if (!match) {
    return undefined;
  }

  const dq = match[1];
  const sq = match[2];
  const id = match[3];
  const name = dq || sq || id;
  if (!name) {
    return undefined;
  }

  return {
    className: name,
    isStringLiteralName: !!(dq || sq),
  };
}

function buildAliasAlternation(aliases: string[]): string {
  // Longest first so multi-segment names like `React.createElement` win over
  // bare `createElement` during alternation.
  const sorted = [...aliases].sort((a, b) => b.length - a.length);
  return sorted.map(escapeRegex).join("|");
}

function escapeRegex(s: string): string {
  return s.replace(/[.+*?^$()[\]{}|\\]/g, "\\$&");
}

// ============================================================================
// In-file prop inference (1.2.0).
// ============================================================================

export interface ComponentAnnotations {
  extendsClass?: string;
  props: string[];
}

export interface DocumentComponentInfo {
  name: string;
  defLineIndex: number;
  paramTypeFields?: string[];
  annotations: ComponentAnnotations;
  detectedBase?: string;
}

const LUA_BLOCK_OPENERS = new Set(["function", "if", "do", "repeat"]);
const LUA_BLOCK_CLOSERS = new Set(["end", "until"]);

function applyMask(text: string, mask: boolean[]): string {
  const out: string[] = [];
  for (let i = 0; i < text.length; i++) {
    if (mask[i]) {
      out.push(text[i]);
    } else {
      out.push(text[i] === "\n" ? "\n" : " ");
    }
  }
  return out.join("");
}

function lineNumberOf(text: string, offset: number): number {
  let line = 0;
  const limit = Math.min(offset, text.length);
  for (let i = 0; i < limit; i++) {
    if (text[i] === "\n") {
      line++;
    }
  }
  return line;
}

/**
 * Extract top-level field names from the body of a Luau type literal.
 * Input is the text INSIDE the outermost `{...}` (without those braces).
 * Skips index signatures (`[K]: V`) and ignores fields nested inside `{}`,
 * `()`, or `<>`.
 */
export function extractTypeFields(literalBody: string): string[] {
  const masked = applyMask(literalBody, buildCodeMask(literalBody));
  const fields: string[] = [];
  let i = 0;
  let braceDepth = 0;
  let parenDepth = 0;
  let angleDepth = 0;
  let expectingFieldName = true;

  while (i < masked.length) {
    const c = masked[i];

    if (c === "{") {
      braceDepth++;
      expectingFieldName = false;
      i++;
      continue;
    }
    if (c === "}") {
      braceDepth--;
      i++;
      continue;
    }
    if (c === "(") {
      parenDepth++;
      expectingFieldName = false;
      i++;
      continue;
    }
    if (c === ")") {
      parenDepth--;
      i++;
      continue;
    }
    if (c === "<") {
      angleDepth++;
      expectingFieldName = false;
      i++;
      continue;
    }
    if (c === ">") {
      // Don't decrement below zero — `->` in a function type would
      // otherwise corrupt the depth.
      if (angleDepth > 0) {
        angleDepth--;
      }
      i++;
      continue;
    }

    const atTopLevel =
      braceDepth === 0 && parenDepth === 0 && angleDepth === 0;

    if (atTopLevel) {
      if (c === "," || c === ";") {
        expectingFieldName = true;
        i++;
        continue;
      }
      if (c === "[") {
        // Index signature `[Key]: Value` — skip the brackets and following type.
        let depth = 1;
        i++;
        while (i < masked.length && depth > 0) {
          if (masked[i] === "[") {
            depth++;
          } else if (masked[i] === "]") {
            depth--;
          }
          i++;
        }
        expectingFieldName = false;
        continue;
      }
      if (expectingFieldName && /[A-Za-z_]/.test(c)) {
        const start = i;
        while (i < masked.length && /\w/.test(masked[i])) {
          i++;
        }
        const name = masked.slice(start, i);
        let j = i;
        while (j < masked.length && /\s/.test(masked[j])) {
          j++;
        }
        if (masked[j] === ":") {
          fields.push(name);
        }
        expectingFieldName = false;
        continue;
      }
    }

    i++;
  }

  return fields;
}

/**
 * Walk backward from `defLineIndex - 1` over consecutive `---` comment
 * lines and pull recognized directives.
 */
export function parseAnnotationsForComponent(
  text: string,
  defLineIndex: number
): ComponentAnnotations {
  const lines = text.split("\n");
  const result: ComponentAnnotations = { props: [] };
  const commentLines: string[] = [];

  for (let i = defLineIndex - 1; i >= 0; i--) {
    const trimmed = lines[i].trimStart();
    if (!trimmed.startsWith("---")) {
      break;
    }
    commentLines.unshift(trimmed);
  }

  for (const line of commentLines) {
    const extendsMatch = /^---\s*@extends\s+([A-Za-z_][A-Za-z0-9_.]*)/.exec(
      line
    );
    if (extendsMatch) {
      result.extendsClass = extendsMatch[1];
      continue;
    }
    const propMatch = /^---\s*@prop\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(line);
    if (propMatch) {
      result.props.push(propMatch[1]);
      continue;
    }
  }

  return result;
}

/**
 * Starting at `startIdx`, with depth implicitly already at 1, find the
 * position just after the matching block closer (`end` or `until`).
 */
function findMatchingEnd(masked: string, startIdx: number): number {
  let depth = 1;
  const tokenRe = /\b\w+\b/g;
  tokenRe.lastIndex = startIdx;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(masked)) !== null) {
    if (LUA_BLOCK_OPENERS.has(m[0])) {
      depth++;
    } else if (LUA_BLOCK_CLOSERS.has(m[0])) {
      depth--;
      if (depth === 0) {
        return m.index + m[0].length;
      }
    }
  }
  return masked.length;
}

function findMatchingBrace(text: string, openIdx: number): number {
  let depth = 1;
  for (let i = openIdx + 1; i < text.length; i++) {
    if (text[i] === "{") {
      depth++;
    } else if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

/**
 * Find the first `return ALIAS(CLASS, ...)` whose enclosing function is the
 * component (i.e. not inside a nested function literal). Conditional returns
 * inside `if`/`do`/`while`/`for`/`repeat` blocks still count.
 *
 * `maskedText` is used for token scanning (so braces inside strings/comments
 * don't trip us up), `originalText` is used for capturing the class name
 * (because masking blanks out string interiors).
 */
export function detectReturnedClass(
  originalText: string,
  maskedText: string,
  bodyStart: number,
  bodyEnd: number,
  aliases: string[]
): string | undefined {
  const aliasPattern = buildAliasAlternation(aliases);
  const returnAliasPattern = new RegExp(
    `^\\s*\\(?\\s*(?:${aliasPattern})\\s*\\(\\s*` +
      `(?:"([A-Za-z_][A-Za-z0-9_]*)"|'([A-Za-z_][A-Za-z0-9_]*)'|` +
      `([A-Za-z_][A-Za-z0-9_]*(?:\\.[A-Za-z_][A-Za-z0-9_]*)*))`
  );

  const stack: string[] = [];
  const tokenRe = /\b\w+\b/g;
  tokenRe.lastIndex = bodyStart;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(maskedText)) !== null) {
    if (m.index >= bodyEnd) {
      break;
    }
    const word = m[0];
    if (word === "function") {
      stack.push("fn");
    } else if (word === "if" || word === "do" || word === "repeat") {
      stack.push(word);
    } else if (word === "end" || word === "until") {
      stack.pop();
    } else if (word === "return") {
      // Only the *enclosing-function* depth matters. Returns inside
      // if/do/while/for/repeat blocks are still the component's returns.
      const functionDepth = stack.reduce(
        (n, t) => n + (t === "fn" ? 1 : 0),
        0
      );
      if (functionDepth === 0) {
        const after = originalText.slice(m.index + word.length, bodyEnd);
        const r = returnAliasPattern.exec(after);
        if (r) {
          const name = r[1] || r[2] || r[3];
          if (name) {
            return name;
          }
        }
      }
    }
  }
  return undefined;
}

function collectTypeAliases(maskedText: string): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const re = /\btype\s+([A-Za-z_]\w*)\s*=\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(maskedText)) !== null) {
    const name = m[1];
    const braceStart = m.index + m[0].length - 1;
    const braceEnd = findMatchingBrace(maskedText, braceStart);
    if (braceEnd === -1) {
      continue;
    }
    const body = maskedText.slice(braceStart + 1, braceEnd);
    result.set(name, extractTypeFields(body));
  }
  return result;
}

interface FunctionDef {
  name: string;
  defIdx: number;
  paramType?: string;
  bodyStart: number;
  bodyEnd: number;
}

interface ParameterListInfo {
  firstParamType?: string;
  paramListEnd: number;
}

function parseParameterList(
  maskedText: string,
  openParenIdx: number
): ParameterListInfo | undefined {
  let i = openParenIdx + 1;
  let firstParamType: string | undefined;

  while (i < maskedText.length && /\s/.test(maskedText[i])) {
    i++;
  }

  const nameStart = i;
  while (i < maskedText.length && /\w/.test(maskedText[i])) {
    i++;
  }

  if (i > nameStart) {
    let j = i;
    while (j < maskedText.length && /\s/.test(maskedText[j])) {
      j++;
    }
    if (maskedText[j] === ":") {
      j++;
      while (j < maskedText.length && /\s/.test(maskedText[j])) {
        j++;
      }
      const typeStart = j;
      let typeEnd = j;
      let bDepth = 0;
      let pDepth = 0;
      let aDepth = 0;
      while (typeEnd < maskedText.length) {
        const c = maskedText[typeEnd];
        if (bDepth === 0 && pDepth === 0 && aDepth === 0) {
          if (c === "," || c === ")") {
            break;
          }
        }
        if (c === "{") {
          bDepth++;
        } else if (c === "}") {
          bDepth--;
        } else if (c === "(") {
          pDepth++;
        } else if (c === ")") {
          if (pDepth === 0) {
            break;
          }
          pDepth--;
        } else if (c === "<") {
          aDepth++;
        } else if (c === ">") {
          if (aDepth > 0) {
            aDepth--;
          }
        }
        typeEnd++;
      }
      firstParamType = maskedText.slice(typeStart, typeEnd).trim();
      i = typeEnd;
    }
  }

  let depth = 1;
  while (i < maskedText.length) {
    const c = maskedText[i];
    if (c === "(") {
      depth++;
    } else if (c === ")") {
      depth--;
      if (depth === 0) {
        return { firstParamType, paramListEnd: i };
      }
    }
    i++;
  }
  return undefined;
}

function findFunctionDefinitions(maskedText: string): FunctionDef[] {
  const results: FunctionDef[] = [];

  const p1 =
    /(?<![A-Za-z0-9_])(?:local\s+)?function\s+([A-Za-z_][A-Za-z0-9_.]*)\s*\(/g;
  const p2 =
    /(?<![A-Za-z0-9_])local\s+([A-Za-z_]\w*)\s*=\s*function\s*\(/g;

  for (const pattern of [p1, p2]) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(maskedText)) !== null) {
      const name = m[1];
      const defIdx = m.index;
      const openParenIdx = m.index + m[0].length - 1;
      const sig = parseParameterList(maskedText, openParenIdx);
      if (!sig) {
        continue;
      }
      const bodyStart = sig.paramListEnd + 1;
      const bodyEnd = findMatchingEnd(maskedText, bodyStart);
      results.push({
        name,
        defIdx,
        paramType: sig.firstParamType,
        bodyStart,
        bodyEnd,
      });
    }
  }

  results.sort((a, b) => a.defIdx - b.defIdx);
  return results;
}

let cachedScan: {
  text: string;
  aliasesKey: string;
  result: Map<string, DocumentComponentInfo>;
} | undefined;

export function scanDocument(
  text: string,
  aliases: string[]
): Map<string, DocumentComponentInfo> {
  const aliasesKey = aliases.join("|");
  if (
    cachedScan &&
    cachedScan.text === text &&
    cachedScan.aliasesKey === aliasesKey
  ) {
    return cachedScan.result;
  }

  const mask = buildCodeMask(text);
  const masked = applyMask(text, mask);
  const typeAliases = collectTypeAliases(masked);
  const components = new Map<string, DocumentComponentInfo>();

  for (const def of findFunctionDefinitions(masked)) {
    const lastSegment = def.name.split(".").pop()!;
    if (components.has(lastSegment)) {
      continue;
    }

    const defLineIndex = lineNumberOf(text, def.defIdx);
    const annotations = parseAnnotationsForComponent(text, defLineIndex);

    let paramTypeFields: string[] | undefined;
    if (def.paramType) {
      const tt = def.paramType.trim();
      if (tt.startsWith("{") && tt.endsWith("}")) {
        paramTypeFields = extractTypeFields(tt.slice(1, -1));
      } else if (/^[A-Za-z_]\w*$/.test(tt)) {
        const aliasFields = typeAliases.get(tt);
        if (aliasFields) {
          paramTypeFields = aliasFields;
        }
      }
    }

    const detectedBase = detectReturnedClass(
      text,
      masked,
      def.bodyStart,
      def.bodyEnd,
      aliases
    );

    components.set(lastSegment, {
      name: lastSegment,
      defLineIndex,
      paramTypeFields,
      annotations,
      detectedBase,
    });
  }

  cachedScan = { text, aliasesKey, result: components };
  return components;
}

// Exported for tests.
export const _internal = {
  defaultPropsMap,
  DEFAULT_ALIASES,
};
