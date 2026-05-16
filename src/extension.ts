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

    const props = getPropsForClass(detected.className);
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

function getPropsForClass(className: string): string[] | undefined {
  const config = vscode.workspace.getConfiguration("reactLuauPropsHelper");
  const userMap = config.get<Record<string, string[]>>("props", {}) ?? {};

  // Presence in user config is authoritative. An explicit `[]` disables the
  // class. Fall back to defaults only when the key is absent.
  if (Object.prototype.hasOwnProperty.call(userMap, className)) {
    return userMap[className];
  }
  return defaultPropsMap[className];
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

// Exported for tests.
export const _internal = {
  defaultPropsMap,
  DEFAULT_ALIASES,
};
