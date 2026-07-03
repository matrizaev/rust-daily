import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  bracketMatching,
  defaultHighlightStyle,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import { rust } from "@codemirror/lang-rust";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { useEffect, useRef } from "react";

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
};

type OnChangeRef = {
  current: (value: string) => void;
};

const editorTheme = EditorView.theme({
  "&": {
    minHeight: "100%",
    height: "100%",
    fontSize: "16px",
    backgroundColor: "#111815",
    color: "#f2efe7",
  },
  ".cm-scroller": {
    fontFamily:
      '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    lineHeight: "1.6",
    overflow: "auto",
  },
  ".cm-content": {
    padding: "18px 0",
    caretColor: "#f2efe7",
  },
  ".cm-line": {
    padding: "0 18px 0 10px",
  },
  ".cm-gutters": {
    backgroundColor: "#111815",
    borderRight: "1px solid #2b3730",
    color: "#8da092",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#1a251f",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "#36584a",
  },
  "&.cm-focused": {
    outline: "2px solid #2e6f56",
    outlineOffset: "-2px",
  },
  ".cm-matchingBracket": {
    backgroundColor: "#3b563c",
    color: "#ffffff",
  },
  ".cm-nonmatchingBracket": {
    backgroundColor: "#7d3227",
    color: "#ffffff",
  },
});

const createEditorState = (
  value: string,
  ariaLabel: string,
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
      indentUnit.of("    "),
      EditorState.tabSize.of(4),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.lineWrapping,
      editorTheme,
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

function CodeEditor({ value, onChange, ariaLabel }: CodeEditorProps) {
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
      state: createEditorState(value, ariaLabel, onChangeRef),
      parent: hostRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [ariaLabel]);

  useEffect(() => {
    syncEditorDocument(viewRef.current, value);
  }, [value]);

  return <div className="code-editor" ref={hostRef} />;
}

export default CodeEditor;
