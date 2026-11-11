import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type EditableFileHeaderProps = {
  filePath: string;
  content: string;
};

export function EditableFileHeader({
  filePath,
  content,
}: EditableFileHeaderProps) {
  const [copyStatus, setCopyStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const copyResetTimeout = useRef<number | null>(null);

  useEffect(() => {
    setCopyStatus("");
    setCopied(false);

    return () => {
      if (copyResetTimeout.current !== null) {
        window.clearTimeout(copyResetTimeout.current);
        copyResetTimeout.current = null;
      }
    };
  }, [content]);

  const handleCopy = async () => {
    if (copyResetTimeout.current !== null) {
      window.clearTimeout(copyResetTimeout.current);
      copyResetTimeout.current = null;
    }

    setCopied(false);
    setCopyStatus("");

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setCopyStatus("Editor contents copied.");
      copyResetTimeout.current = window.setTimeout(() => {
        setCopied(false);
        copyResetTimeout.current = null;
      }, 1600);
    } catch {
      setCopyStatus("Could not copy editor contents.");
    }
  };

  return (
    <div className="editor-file-header">
      <span className="editor-file-name">{filePath}</span>
      <button
        className="editor-copy-button"
        type="button"
        onClick={() => void handleCopy()}
        aria-label={copied ? "Editor contents copied" : "Copy editor contents"}
        title={copied ? "Copied!" : "Copy editor contents"}
      >
        {copied ? (
          <Check size={15} aria-hidden="true" />
        ) : (
          <Copy size={15} aria-hidden="true" />
        )}
      </button>
      {copyStatus ? (
        <span className="visually-hidden" role="status">
          {copyStatus}
        </span>
      ) : null}
    </div>
  );
}
