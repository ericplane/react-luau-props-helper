import * as assert from "assert";
import {
  buildCodeMask,
  findEnclosingPropsCall,
  extractTypeFields,
  parseAnnotationsForComponent,
  scanDocument,
  _internal,
} from "../extension";

const ALIASES = _internal.DEFAULT_ALIASES;

function detect(text: string, cursorMarker = "|"): ReturnType<typeof findEnclosingPropsCall> {
  const cursor = text.indexOf(cursorMarker);
  assert.notStrictEqual(cursor, -1, "test text must contain a cursor marker");
  const stripped = text.slice(0, cursor) + text.slice(cursor + cursorMarker.length);
  return findEnclosingPropsCall(stripped, cursor, ALIASES);
}

suite("buildCodeMask", () => {
  test("masks line comments", () => {
    const text = `local x = 1 -- {hidden}\nx = 2`;
    const mask = buildCodeMask(text);
    const idxOfBrace = text.indexOf("{");
    assert.strictEqual(mask[idxOfBrace], false, "{ inside comment is not code");
  });

  test("masks block comments", () => {
    const text = `--[[ {fake} ]]\nlocal y = 3`;
    const mask = buildCodeMask(text);
    assert.strictEqual(mask[text.indexOf("{")], false);
    assert.strictEqual(mask[text.indexOf("}")], false);
  });

  test("masks double-quoted string interiors", () => {
    const text = `local s = "click {here}"\n`;
    const mask = buildCodeMask(text);
    assert.strictEqual(mask[text.indexOf("{")], false);
    assert.strictEqual(mask[text.indexOf("}")], false);
    // Quotes themselves remain code.
    assert.strictEqual(mask[text.indexOf('"')], true);
  });

  test("masks long bracket strings", () => {
    const text = `local s = [==[ {nested} ]==]\n`;
    const mask = buildCodeMask(text);
    assert.strictEqual(mask[text.indexOf("{")], false);
    assert.strictEqual(mask[text.indexOf("}")], false);
  });

  test("leaves real code untouched", () => {
    const text = `e("Frame", { Size = 1 })`;
    const mask = buildCodeMask(text);
    assert.strictEqual(mask[text.indexOf("{")], true);
    assert.strictEqual(mask[text.indexOf("}")], true);
  });
});

suite("findEnclosingPropsCall", () => {
  test("detects simple e(\"Frame\", { ... }) call", () => {
    const result = detect(`e("Frame", { | })`);
    assert.deepStrictEqual(result, {
      className: "Frame",
      isStringLiteralName: true,
    });
  });

  test("detects React.createElement", () => {
    const result = detect(`React.createElement("TextLabel", { | })`);
    assert.deepStrictEqual(result, {
      className: "TextLabel",
      isStringLiteralName: true,
    });
  });

  test("detects Roact.createElement", () => {
    const result = detect(`Roact.createElement("Frame", { | })`);
    assert.strictEqual(result?.className, "Frame");
  });

  test("detects custom component (identifier, no quotes)", () => {
    const result = detect(`e(MyButton, { | })`);
    assert.deepStrictEqual(result, {
      className: "MyButton",
      isStringLiteralName: false,
    });
  });

  test("detects dotted identifier component", () => {
    const result = detect(`e(Components.Button, { | })`);
    assert.strictEqual(result?.className, "Components.Button");
  });

  test("returns the actually-enclosing class, not the last seen one (regression for issue #3)", () => {
    // Cursor is back in Frame's props, after a closed TextLabel child.
    const text = `
e("Frame", {
    child = e("TextLabel", { Text = "x" }),
    |
})`.trimStart();
    const result = detect(text);
    assert.strictEqual(result?.className, "Frame");
  });

  test("handles deep nesting correctly", () => {
    const text = `
e("Frame", {
    Layout = e("UIListLayout", { Padding = 5 }),
    Inner = e("ScrollingFrame", {
        |
    }),
})`.trimStart();
    const result = detect(text);
    assert.strictEqual(result?.className, "ScrollingFrame");
  });

  test("ignores braces inside strings (regression for issue #4)", () => {
    const text = `
e("TextLabel", {
    Text = "click {here}",
    |
})`.trimStart();
    const result = detect(text);
    assert.strictEqual(result?.className, "TextLabel");
  });

  test("ignores braces inside line comments", () => {
    const text = `
e("TextLabel", {
    -- } this } closes nothing
    |
})`.trimStart();
    const result = detect(text);
    assert.strictEqual(result?.className, "TextLabel");
  });

  test("rejects identifier-suffix `e` false positives (regression for issue #5)", () => {
    // `frame(...)` is NOT a createElement call.
    const result = detect(`frame("Frame", { | })`);
    assert.strictEqual(result, undefined);
  });

  test("rejects an identifier ending in `e` followed by paren", () => {
    const result = detect(`createMe("Frame", { | })`);
    assert.strictEqual(result, undefined);
  });

  test("returns undefined outside any createElement call", () => {
    const result = detect(`local t = { | }`);
    assert.strictEqual(result, undefined);
  });

  test("returns undefined inside an unclosed paren expression", () => {
    // Cursor is in the argument list of UDim2.new, not in Frame's props.
    const text = `e("Frame", { Size = UDim2.new(| ) })`;
    const result = detect(text);
    assert.strictEqual(result, undefined);
  });

  test("works when cursor is right after the opening brace", () => {
    const result = detect(`e("Frame", {|})`);
    assert.strictEqual(result?.className, "Frame");
  });

  test("works with the snake-case `createElement` alias", () => {
    const result = detect(`createElement("Frame", { | })`);
    assert.strictEqual(result?.className, "Frame");
  });

  test("custom aliases via config", () => {
    const text = `r("Frame", { | })`;
    const cursor = text.indexOf("|");
    const stripped = text.replace("|", "");
    const result = findEnclosingPropsCall(stripped, cursor, ["r"]);
    assert.strictEqual(result?.className, "Frame");
  });

  test("does not match createElement inside a comment", () => {
    const text = `
-- e("Decoy", {
e("Frame", {
    |
})`.trimStart();
    const result = detect(text);
    assert.strictEqual(result?.className, "Frame");
  });
});

suite("Default props map", () => {
  test("contains Frame with BackgroundColor3", () => {
    assert.ok(_internal.defaultPropsMap.Frame.includes("BackgroundColor3"));
  });

  test("contains TextLabel with Text", () => {
    assert.ok(_internal.defaultPropsMap.TextLabel.includes("Text"));
  });
});

// ============================================================================
// 1.2.0 — in-file prop inference
// ============================================================================

suite("extractTypeFields", () => {
  test("simple flat literal", () => {
    assert.deepStrictEqual(
      extractTypeFields(`a: number, b: string`),
      ["a", "b"]
    );
  });

  test("trailing comma is fine", () => {
    assert.deepStrictEqual(
      extractTypeFields(`a: number, b: string,`),
      ["a", "b"]
    );
  });

  test("semicolon separator works", () => {
    assert.deepStrictEqual(
      extractTypeFields(`a: number; b: string`),
      ["a", "b"]
    );
  });

  test("optional fields", () => {
    assert.deepStrictEqual(
      extractTypeFields(`a: number?, b: string?`),
      ["a", "b"]
    );
  });

  test("nested types do not leak inner fields", () => {
    assert.deepStrictEqual(
      extractTypeFields(`a: { x: number, y: number }, b: string`),
      ["a", "b"]
    );
  });

  test("function-typed field", () => {
    assert.deepStrictEqual(
      extractTypeFields(`onClick: () -> (), label: string`),
      ["onClick", "label"]
    );
  });

  test("function with typed params doesn't leak inner names", () => {
    assert.deepStrictEqual(
      extractTypeFields(`onClick: (x: number) -> string, label: string`),
      ["onClick", "label"]
    );
  });

  test("index signature is skipped", () => {
    assert.deepStrictEqual(
      extractTypeFields(`[string]: number, label: string`),
      ["label"]
    );
  });

  test("generic field type", () => {
    assert.deepStrictEqual(
      extractTypeFields(`items: Array<string>, count: number`),
      ["items", "count"]
    );
  });
});

suite("parseAnnotationsForComponent", () => {
  test("single @extends directive", () => {
    const text = `---@extends Frame\nlocal function Foo() end`;
    const result = parseAnnotationsForComponent(text, 1);
    assert.strictEqual(result.extendsClass, "Frame");
    assert.deepStrictEqual(result.props, []);
  });

  test("multiple @prop lines preserve order", () => {
    const text = [
      "---@prop gamepassId number",
      "---@prop layoutOrder number?",
      "---@prop onActivated () -> ()",
      "local function GamepassCard(props) end",
    ].join("\n");
    const result = parseAnnotationsForComponent(text, 3);
    assert.deepStrictEqual(result.props, [
      "gamepassId",
      "layoutOrder",
      "onActivated",
    ]);
  });

  test("mixed @extends and @prop", () => {
    const text = [
      "---@extends Frame",
      "---@prop gamepassId number",
      "local function GamepassCard(props) end",
    ].join("\n");
    const result = parseAnnotationsForComponent(text, 2);
    assert.strictEqual(result.extendsClass, "Frame");
    assert.deepStrictEqual(result.props, ["gamepassId"]);
  });

  test("stops at first non-triple-dash line", () => {
    const text = [
      "-- a regular comment",
      "---@extends Frame",
      "local function Foo(props) end",
    ].join("\n");
    // The plain `--` comment breaks the chain, so @extends is NOT picked up.
    const result = parseAnnotationsForComponent(text, 2);
    assert.strictEqual(result.extendsClass, "Frame");
  });

  test("returns empty when no annotations present", () => {
    const text = `local function Foo(props) end`;
    const result = parseAnnotationsForComponent(text, 0);
    assert.strictEqual(result.extendsClass, undefined);
    assert.deepStrictEqual(result.props, []);
  });
});

suite("scanDocument — function discovery", () => {
  test("discovers a `local function` definition", () => {
    const text = `local function Foo(props) return e("Frame", {}) end`;
    const result = scanDocument(text, ALIASES);
    assert.ok(result.has("Foo"));
  });

  test("discovers a `local X = function` definition", () => {
    const text = `local Bar = function(props) return e("TextLabel", {}) end`;
    const result = scanDocument(text, ALIASES);
    assert.ok(result.has("Bar"));
  });

  test("discovers a dotted function definition (indexed by last segment)", () => {
    const text = `function Module.Baz(props) return e("Frame", {}) end`;
    const result = scanDocument(text, ALIASES);
    assert.ok(result.has("Baz"));
  });
});

suite("scanDocument — return-statement auto-detection", () => {
  test("simple `return e(\"Frame\", ...)`", () => {
    const text = `local function Foo(props) return e("Frame", {}) end`;
    const info = scanDocument(text, ALIASES).get("Foo");
    assert.strictEqual(info?.detectedBase, "Frame");
  });

  test("skips returns inside nested functions", () => {
    const text = `
local function Outer(props)
    local inner = function()
        return e("Inner", {})
    end
    return e("Outer", {})
end`.trimStart();
    const info = scanDocument(text, ALIASES).get("Outer");
    assert.strictEqual(info?.detectedBase, "Outer");
  });

  test("doesn't detect when no createElement is returned", () => {
    const text = `local function Foo(props) return 1 end`;
    const info = scanDocument(text, ALIASES).get("Foo");
    assert.strictEqual(info?.detectedBase, undefined);
  });

  test("ignores returns inside `hover:map(function() return X end)` style callbacks", () => {
    const text = `
local function GamepassCard(props)
    local color = hover:map(function(h)
        return otherClass:Lerp(other, h)
    end)
    return e("Frame", {})
end`.trimStart();
    const info = scanDocument(text, ALIASES).get("GamepassCard");
    assert.strictEqual(info?.detectedBase, "Frame");
  });

  test("ignores `return` inside `if/then/end` block correctly", () => {
    const text = `
local function Foo(props)
    if cond then
        return e("A", {})
    end
    return e("B", {})
end`.trimStart();
    const info = scanDocument(text, ALIASES).get("Foo");
    // First top-level return wins.
    assert.strictEqual(info?.detectedBase, "A");
  });
});

suite("scanDocument — typed signature inference", () => {
  test("inline literal type", () => {
    const text = `local function Foo(props: { a: number, b: string }) end`;
    const info = scanDocument(text, ALIASES).get("Foo");
    assert.deepStrictEqual(info?.paramTypeFields, ["a", "b"]);
  });

  test("named type alias resolves", () => {
    const text = [
      "type FooProps = { a: number, b: string }",
      "local function Foo(props: FooProps) end",
    ].join("\n");
    const info = scanDocument(text, ALIASES).get("Foo");
    assert.deepStrictEqual(info?.paramTypeFields, ["a", "b"]);
  });

  test("no type annotation → no signature fields", () => {
    const text = `local function Foo(props) end`;
    const info = scanDocument(text, ALIASES).get("Foo");
    assert.strictEqual(info?.paramTypeFields, undefined);
  });

  test("return-type annotation doesn't confuse parser", () => {
    const text = `local function Foo(props: { a: number }): React.ReactNode end`;
    const info = scanDocument(text, ALIASES).get("Foo");
    assert.deepStrictEqual(info?.paramTypeFields, ["a"]);
  });
});

suite("scanDocument — annotations integration", () => {
  test("picks up @extends and @prop above a function", () => {
    const text = [
      "---@extends Frame",
      "---@prop gamepassId number",
      "local function GamepassCard(props) end",
    ].join("\n");
    const info = scanDocument(text, ALIASES).get("GamepassCard");
    assert.strictEqual(info?.annotations.extendsClass, "Frame");
    assert.deepStrictEqual(info?.annotations.props, ["gamepassId"]);
  });
});

suite("scanDocument — caching", () => {
  test("returns the same map instance for the same input", () => {
    const text = `local function Foo(props) return e("Frame", {}) end`;
    const a = scanDocument(text, ALIASES);
    const b = scanDocument(text, ALIASES);
    assert.strictEqual(a, b);
  });
});
