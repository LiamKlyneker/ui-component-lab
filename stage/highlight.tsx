import type { ReactNode } from "react";

/**
 * A small tokenizer for the JSX/TSX snippets an entry's `usage` returns. It is
 * not a parser: it tracks only whether it is in code, inside a JSX tag, or in
 * JSX children. It never throws; anything it cannot classify is plain text.
 */
export type TokenKind =
  | "plain"
  | "comment"
  | "string"
  | "number"
  | "keyword"
  | "control"
  | "variable"
  | "function"
  | "punct"
  | "tag-bracket"
  | "tag"
  | "component"
  | "attr"
  | "attr-string"
  | "jsx-text";

export type Token = { kind: TokenKind; text: string };

const CONTROL = new Set([
  "import", "from", "export", "default", "return", "if", "else", "for", "while", "switch",
  "case", "break", "continue", "throw", "try", "catch", "finally", "await", "as",
]);
const KEYWORD = new Set([
  "const", "let", "var", "function", "new", "typeof", "instanceof", "in", "of", "void",
  "true", "false", "null", "undefined", "this", "class", "extends", "type", "interface",
  "async", "keyof", "readonly",
]);

const RE = {
  space: /\s+/y,
  lineComment: /\/\/[^\n]*/y,
  blockComment: /\/\*[\s\S]*?(?:\*\/|$)/y,
  string: /"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?|`(?:[^`\\]|\\[\s\S])*`?/y,
  number: /\d[\d_]*(?:\.\d+)?/y,
  ident: /[A-Za-z_$][\w$]*/y,
  tagName: /[A-Za-z_$][\w$.:-]*/y,
  attrName: /[A-Za-z_$][\w$:-]*/y,
  jsxText: /[^<{]+/y,
};

type Frame = "js" | "tag" | "close-tag" | "children";

function match(re: RegExp, code: string, at: number): string | null {
  re.lastIndex = at;
  const m = re.exec(code);
  return m && m[0].length > 0 ? m[0] : null;
}

export function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  const stack: Frame[] = ["js"];
  const push = (kind: TokenKind, text: string): void => {
    const last = tokens[tokens.length - 1];
    if (last && last.kind === kind) last.text += text;
    else tokens.push({ kind, text });
  };
  // A `<` opens JSX unless the previous code token could end an expression (`a < b`, `Array<T>`).
  let lastSignificant: TokenKind | null = null;
  let i = 0;

  const openTag = (): void => {
    const closing = code[i + 1] === "/";
    push("tag-bracket", closing ? "</" : "<");
    i += closing ? 2 : 1;
    const name = match(RE.tagName, code, i);
    if (name) {
      push(/^[A-Z]/.test(name) || name.includes(".") ? "component" : "tag", name);
      i += name.length;
    }
    stack.push(closing ? "close-tag" : "tag");
  };

  while (i < code.length) {
    const frame = stack[stack.length - 1];
    const ch = code[i];
    let text: string | null;

    if (frame === "children") {
      if (ch === "<") {
        openTag();
      } else if (ch === "{") {
        push("punct", ch);
        stack.push("js");
        i += 1;
      } else {
        text = match(RE.jsxText, code, i) ?? ch;
        push("jsx-text", text);
        i += text.length;
      }
      continue;
    }

    if (frame === "tag" || frame === "close-tag") {
      if ((text = match(RE.space, code, i))) {
        push("plain", text);
      } else if (code.startsWith("/>", i)) {
        push("tag-bracket", "/>");
        stack.pop();
        text = "/>";
      } else if (ch === ">") {
        push("tag-bracket", ">");
        stack.pop();
        if (frame === "tag") stack.push("children");
        else if (stack[stack.length - 1] === "children") stack.pop();
        text = ">";
      } else if (ch === "{") {
        push("punct", ch);
        stack.push("js");
        text = ch;
      } else if ((text = match(RE.string, code, i))) {
        push("attr-string", text);
      } else if ((text = match(RE.attrName, code, i))) {
        push("attr", text);
      } else {
        text = ch;
        push("punct", ch);
      }
      i += text.length;
      if (stack.length === 1 && stack[0] === "js") lastSignificant = "punct";
      continue;
    }

    // frame === "js"
    if ((text = match(RE.space, code, i))) {
      push("plain", text);
      i += text.length;
      continue;
    }
    if ((text = match(RE.lineComment, code, i) ?? match(RE.blockComment, code, i))) {
      push("comment", text);
      i += text.length;
      continue;
    }
    if (
      ch === "<" &&
      /[A-Za-z>/]/.test(code[i + 1] ?? "") &&
      lastSignificant !== "variable" &&
      lastSignificant !== "number" &&
      lastSignificant !== "component"
    ) {
      openTag();
      continue;
    }
    if ((text = match(RE.string, code, i))) {
      push("string", text);
    } else if ((text = match(RE.number, code, i))) {
      push("number", text);
    } else if ((text = match(RE.ident, code, i))) {
      const kind: TokenKind = CONTROL.has(text)
        ? "control"
        : KEYWORD.has(text)
          ? "keyword"
          : code[i + text.length] === "("
            ? "function"
            : "variable";
      push(kind, text);
    } else {
      text = ch;
      push("punct", ch);
      if (ch === "{") stack.push("js");
      if (ch === "}" && stack.length > 1) stack.pop();
    }
    i += text.length;
    const top = tokens[tokens.length - 1];
    lastSignificant =
      top.kind === "punct" && (text === ")" || text === "]") ? "variable" : top.kind;
  }
  return tokens;
}

const MAX_HIGHLIGHT = 20000;

/** Highlighted spans for `code`; plain text when the snippet is too long or anything fails. */
export function highlight(code: string): ReactNode {
  if (code.length > MAX_HIGHLIGHT) return code;
  try {
    return tokenize(code).map((token, index) =>
      token.kind === "plain" ? (
        token.text
      ) : (
        <span key={index} className={`lab-tok-${token.kind}`}>
          {token.text}
        </span>
      ),
    );
  } catch {
    return code;
  }
}
