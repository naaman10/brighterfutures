"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { marked } from "marked";
import { toast } from "sonner";
import { saveSessionSummaryAction } from "./actions";

const DEBOUNCE_MS = 600;

/** If content looks like markdown, convert to HTML for the editor. */
function contentToHtml(raw: string | null): string {
  if (!raw || !raw.trim()) return "<p></p>";
  const trimmed = raw.trim();
  if (trimmed.startsWith("<") && trimmed.includes(">")) return trimmed;
  try {
    return marked.parse(trimmed, { async: false }) as string;
  } catch {
    return `<p>${trimmed.replace(/</g, "&lt;")}</p>`;
  }
}

type Props = {
  sessionId: string;
  studentId: string;
  initialSummary: string | null;
};

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap gap-1 border-b border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800/50">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`rounded px-2 py-1 text-sm font-semibold ${editor.isActive("bold") ? "bg-zinc-300 dark:bg-zinc-600" : "hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
        title="Bold"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`rounded px-2 py-1 text-sm italic ${editor.isActive("italic") ? "bg-zinc-300 dark:bg-zinc-600" : "hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
        title="Italic"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`rounded px-2 py-1 text-sm ${editor.isActive("bulletList") ? "bg-zinc-300 dark:bg-zinc-600" : "hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
        title="Bullet list"
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`rounded px-2 py-1 text-sm ${editor.isActive("orderedList") ? "bg-zinc-300 dark:bg-zinc-600" : "hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
        title="Numbered list"
      >
        1. List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`rounded px-2 py-1 text-sm ${editor.isActive("heading", { level: 2 }) ? "bg-zinc-300 dark:bg-zinc-600" : "hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
        title="Heading"
      >
        H2
      </button>
    </div>
  );
}

export function SessionSummaryEditor({ sessionId, studentId, initialSummary }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const lastSavedHtml = useRef(initialSummary ?? "");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (html: string) => {
      setSaving(true);
      const result = await saveSessionSummaryAction(sessionId, studentId, html || null);
      setSaving(false);
      if (result.error) {
        toast.error(result.error);
      } else {
        lastSavedHtml.current = html;
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    },
    [sessionId, studentId]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write your session notes…" }),
    ],
    content: contentToHtml(initialSummary),
    editorProps: {
      attributes: {
        class:
          "min-h-[240px] w-full px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:my-1",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html === lastSavedHtml.current) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => save(html), DEBOUNCE_MS);
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (editor && editor.getHTML() !== lastSavedHtml.current) {
        save(editor.getHTML());
      }
    };
  }, [editor, save]);

  const handleBlur = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (editor) {
      const html = editor.getHTML();
      if (html !== lastSavedHtml.current) save(html);
    }
  }, [editor, save]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Session Summary
        </label>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {saving ? "Saving…" : saved ? "Saved" : "Auto-saves as you type"}
        </span>
      </div>
      <div
        className="overflow-hidden rounded-lg border border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800"
        onBlur={handleBlur}
      >
        {editor && (
          <>
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
          </>
        )}
      </div>
    </div>
  );
}
