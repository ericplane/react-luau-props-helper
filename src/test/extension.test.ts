import * as assert from "assert";
import {
  buildCodeMask,
  findEnclosingPropsCall,
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
