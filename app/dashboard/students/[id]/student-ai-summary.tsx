"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { generateStudentAISummary } from "./actions";

type Props = { studentId: string; initialSummary: string | null };

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-3 last:mb-0">{children}</p>,
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="mb-2 mt-3 text-sm font-semibold first:mt-0">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="mb-1 mt-2 text-sm font-medium first:mt-0">{children}</h3>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="mb-3 list-disc pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="mb-3 list-decimal pl-5 last:mb-0">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="mb-0.5">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold">{children}</strong>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => <a href={href} className="text-white underline decoration-white/60 hover:decoration-white" target="_blank" rel="noopener noreferrer">{children}</a>,
  code: ({ children }: { children?: React.ReactNode }) => <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">{children}</code>,
  pre: ({ children }: { children?: React.ReactNode }) => <pre className="mb-3 overflow-x-auto rounded-lg bg-white/10 p-3 text-xs last:mb-0">{children}</pre>,
};

export function StudentAISummary({ studentId, initialSummary }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ summary?: string; error?: string } | null>(null);
  const [expanded, setExpanded] = useState(false);

  const displaySummary = result?.summary ?? (result ? null : initialSummary);

  async function handleClick() {
    setResult(null);
    setLoading(true);
    try {
      const res = await generateStudentAISummary(studentId);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50"
        >
          <svg
            className="size-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
            <path d="M20 2v4" />
            <path d="M22 4h-4" />
            <circle cx="4" cy="20" r="2" />
          </svg>
          {loading ? "Generating…" : "Generate AI summary"}
        </button>
      </div>
      {result?.error && (
        <p className="text-sm text-red-300">{result.error}</p>
      )}
      {(displaySummary ?? null) && (
        <div className="rounded-lg border border-white/20 bg-white/5 overflow-hidden">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex w-full items-center justify-between gap-2 p-3 text-left text-sm text-white hover:bg-white/5 transition-colors"
            aria-expanded={expanded}
          >
            <span className="font-medium">Summary</span>
            <span className="text-white/70">
              {expanded ? (
                <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              ) : (
                <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </span>
          </button>
          {expanded ? (
            <div className="ai-summary-markdown border-t border-white/20 p-4 text-sm text-white">
              <ReactMarkdown components={markdownComponents}>
                {displaySummary}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="border-t border-white/20 p-3 text-sm text-white/90 line-clamp-2 overflow-hidden [&>*]:!mb-0">
              <ReactMarkdown components={markdownComponents}>
                {displaySummary}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
