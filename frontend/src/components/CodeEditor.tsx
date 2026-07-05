import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  bracketMatching,
  defaultHighlightStyle,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import { rust } from "@codemirror/lang-rust";
import { EditorState } from "@codemirror/state";
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
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
      drawSelection(),
      rectangularSelection(),
      crosshairCursor(),
      EditorView.lineWrapping,
      createEditorTheme(fontSize),
      updateListener,
      EditorView.contentAttributes.of({
        "aria-label": ariaLabel,
      }),
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

function CodeEditor({
  value,
  onChange,
  ariaLabel,
  fontSize,
}: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hostRef.current) {
      return undefined;
    }

    const view = new EditorView({
      state: createEditorState(value, ariaLabel, fontSize, onChangeRef),
      parent: hostRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [ariaLabel, fontSize]);

  useEffect(() => {
    syncEditorDocument(viewRef.current, value);
  }, [value]);

  return <div className="code-editor" ref={hostRef} />;
}

export default CodeEditor;
