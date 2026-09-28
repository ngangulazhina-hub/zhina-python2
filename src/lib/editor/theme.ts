import type { CSSProperties } from "react";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import type { IdeSettings } from "@/lib/ide/store";

export function editorTheme(settings: IdeSettings) {
  const highlight = HighlightStyle.define([
    { tag: t.comment, color: settings.editorComment, fontStyle: "italic" },
    { tag: t.lineComment, color: settings.editorComment, fontStyle: "italic" },
    { tag: t.keyword, color: settings.editorKeyword },
    { tag: t.controlKeyword, color: settings.editorKeyword },
    { tag: t.definitionKeyword, color: settings.editorKeyword },
    { tag: t.operatorKeyword, color: settings.editorKeyword },
    { tag: t.string, color: settings.editorString },
    { tag: t.number, color: settings.editorNumber },
    { tag: t.bool, color: settings.editorKeyword },
    { tag: t.null, color: settings.editorKeyword },
    { tag: t.function(t.definition(t.variableName)), color: settings.editorFunction },
    { tag: t.function(t.variableName), color: settings.editorFunction },
    { tag: t.className, color: settings.editorFunction },
    { tag: t.definition(t.variableName), color: settings.editorFg },
    { tag: t.self, color: settings.editorKeyword },
    { tag: t.propertyName, color: settings.editorFg },
    { tag: t.operator, color: settings.editorFg },
    { tag: t.punctuation, color: settings.editorFg },
    { tag: t.meta, color: settings.editorComment },
    { tag: t.invalid, color: "#d4726a" },
  ]);

  const theme = EditorView.theme(
    {
      "&": {
        backgroundColor: settings.editorBg,
        color: settings.editorFg,
      },
      ".cm-content": {
        caretColor: settings.editorCursor,
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}px`,
        fontWeight: settings.fontWeight,
        fontStyle: settings.fontStyle,
      },
      ".cm-gutters": {
        backgroundColor: settings.editorBg,
        color: settings.editorGutter,
        border: "none",
      },
      ".cm-activeLine": { backgroundColor: settings.editorLine },
      ".cm-activeLineGutter": { backgroundColor: settings.editorLine, color: settings.editorFg },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: settings.editorSelection,
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: settings.editorCursor,
        borderLeftWidth: "2.5px",
      },
      ".cm-cursorlayer": { pointerEvents: "none" },
      ".cm-matchingBracket": {
        outline: `1px solid ${settings.editorKeyword}`,
        backgroundColor: "transparent",
      },
      ".cm-panels": {
        backgroundColor: settings.editorBg,
        color: settings.editorFg,
      },
      ".cm-panels.cm-panels-top": { borderBottom: `1px solid ${settings.editorGutter}` },
      ".cm-searchMatch": { backgroundColor: `${settings.editorSelection}80` },
      ".cm-searchMatch.cm-searchMatch-selected": { backgroundColor: settings.editorSelection },
      ".cm-search": {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "6px",
        padding: "8px",
      },
      ".cm-search label": { fontSize: "13px" },
      ".cm-textfield": {
        backgroundColor: settings.editorLine,
        color: settings.editorFg,
        border: `1px solid ${settings.editorGutter}`,
        borderRadius: "8px",
        padding: "6px 8px",
        fontSize: "13px",
      },
      ".cm-button": {
        backgroundColor: settings.editorLine,
        color: settings.editorFg,
        border: `1px solid ${settings.editorGutter}`,
        borderRadius: "8px",
        padding: "6px 10px",
        fontSize: "13px",
        backgroundImage: "none",
      },
    },
    { dark: luminance(settings.editorBg) < 0.45 },
  );

  return [theme, syntaxHighlighting(highlight)];
}

function luminance(hex: string) {
  const c = hex.replace("#", "");
  if (c.length < 6) return 0;
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function editorCssVars(settings: IdeSettings): CSSProperties {
  return {
    "--ed-bg": settings.editorBg,
    "--ed-fg": settings.editorFg,
    "--ed-gutter": settings.editorGutter,
    "--ed-selection": settings.editorSelection,
    "--ed-line": settings.editorLine,
    "--ed-block": settings.editorBlock,
    "--ed-guide": settings.editorGuide,
    "--ed-cursor": settings.editorCursor,
    "--ed-comment": settings.editorComment,
    "--ed-keyword": settings.editorKeyword,
    "--ed-string": settings.editorString,
    "--ed-font": settings.fontFamily,
    "--ed-size": `${settings.fontSize}px`,
    "--ed-weight": settings.fontWeight,
    "--ed-style": settings.fontStyle,
  } as CSSProperties;
}
