import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  bracketMatching,
  HighlightStyle,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import { rust } from "@codemirror/lang-rust";
import { Compartment, EditorState } from "@codemirror/state";
import { tags } from "@lezer/highlight";
import {
  crosshairCursor,
  drawSelection,
  EditorView,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from "@codemirror/view";
import { useEffect, useRef } from "react";

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  fontSize: number;
};

type OnChangeRef = {
  current: (value: string) => void;
};

const editorHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "var(--editor-token-keyword)" },
  {
    tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName],
    color: "var(--editor-token-symbol)",
  },
  {
    tag: [tags.function(tags.name), tags.labelName],
    color: "var(--editor-token-function)",
  },
  {
    tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)],
    color: "var(--editor-token-constant)",
  },
  {
    tag: [tags.definition(tags.name), tags.separator],
    color: "var(--editor-token-definition)",
  },
  {
    tag: [tags.className, tags.typeName, tags.number, tags.changed, tags.annotation],
    color: "var(--editor-token-type)",
  },
  {
    tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp],
    color: "var(--editor-token-operator)",
  },
  {
    tag: [tags.string, tags.special(tags.string), tags.inserted],
    color: "var(--editor-token-string)",
  },
  { tag: [tags.meta, tags.comment], color: "var(--editor-token-comment)" },
  { tag: tags.invalid, color: "var(--editor-token-invalid)" },
]);

const createEditorTheme = (fontSize: number) => EditorView.theme({
  "&": {
    minHeight: "100%",
    height: "100%",
    fontSize: `${fontSize}px`,
    backgroundColor: "var(--editor-bg)",
    color: "var(--editor-text)",
  },
  ".cm-scroller": {
    fontFamily:
      '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    lineHeight: "1.6",
    overflow: "auto",
  },
  ".cm-content": {
    padding: "18px 0",
    caretColor: "var(--editor-text)",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--editor-caret)",
    borderLeftWidth: "2px",
  },
  ".cm-fat-cursor": {
    backgroundColor: "var(--editor-caret)",
  },
  ".cm-line": {
    padding: "0 18px 0 10px",
  },
  ".cm-gutters": {
    backgroundColor: "var(--editor-bg)",
    borderRight: "1px solid var(--editor-border)",
    color: "var(--editor-muted)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "var(--editor-line)",
  },
  ".cm-activeLine": {
    backgroundColor: "var(--editor-line)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "var(--editor-selection)",
  },
  "&.cm-focused": {
    outline: "2px solid var(--focus)",
    outlineOffset: "-2px",
  },
  ".cm-matchingBracket": {
    backgroundColor: "var(--editor-match)",
    color: "var(--editor-text)",
  },
  ".cm-nonmatchingBracket": {
    backgroundColor: "var(--editor-mismatch)",
    color: "var(--editor-text)",
  },
});

const createEditorState = (
  value: string,
  ariaLabel: string,
  fontSize: number,
  onChangeRef: OnChangeRef,
  themeCompartment: Compartment,
  contentAttributesCompartment: Compartment,
) => {
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      onChangeRef.current(update.state.doc.toString());
    }
  });

  return EditorState.create({
    doc: value,
    extensions: [
      lineNumbers(),
      highlightSpecialChars(),
      history(),
      bracketMatching(),
      rust(),
      EditorState.allowMultipleSelections.of(true),
      indentUnit.of("    "),
      EditorState.tabSize.of(4),
      syntaxHighlighting(editorHighlightStyle, { fallback: true }),
      keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
      drawSelection(),
      rectangularSelection(),
      crosshairCursor(),
      EditorView.lineWrapping,
      themeCompartment.of(createEditorTheme(fontSize)),
      updateListener,
      contentAttributesCompartment.of(
        EditorView.contentAttributes.of({
          "aria-label": ariaLabel,
        }),
      ),
    ],
  });
};

const syncEditorDocument = (view: EditorView | null, value: string) => {
  if (!view || view.state.doc.toString() === value) {
    return;
  }

  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: value,
    },
  });
};

/** CodeMirror-backed Rust editor used for the editable lesson file. */
export function CodeEditor({
  value,
  onChange,
  ariaLabel,
  fontSize,
}: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const themeCompartmentRef = useRef(new Compartment());
  const contentAttributesCompartmentRef = useRef(new Compartment());

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hostRef.current) {
      return undefined;
    }

    const view = new EditorView({
      state: createEditorState(
        value,
        ariaLabel,
        fontSize,
        onChangeRef,
        themeCompartmentRef.current,
        contentAttributesCompartmentRef.current,
      ),
      parent: hostRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    syncEditorDocument(viewRef.current, value);
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    view.dispatch({
      effects: themeCompartmentRef.current.reconfigure(
        createEditorTheme(fontSize),
      ),
    });
  }, [fontSize]);

  useEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    view.dispatch({
      effects: contentAttributesCompartmentRef.current.reconfigure(
        EditorView.contentAttributes.of({
          "aria-label": ariaLabel,
        }),
      ),
    });
  }, [ariaLabel]);

  return <div className="code-editor" ref={hostRef} />;
}
