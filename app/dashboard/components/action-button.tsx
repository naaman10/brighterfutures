"use client";

import {
  useCallback,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

/**
 * Runs one async action at a time. The ref blocks a second call before React
 * re-renders the disabled button, so a double-click cannot create duplicates.
 */
export function useActionLock<K extends string = string>() {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [activeKey, setActiveKey] = useState<K | null>(null);

  const run = useCallback(async <T,>(action: () => Promise<T>, key?: K): Promise<T | undefined> => {
    if (locked.current) return undefined;
    locked.current = true;
    setPending(true);
    setActiveKey(key ?? null);
    try {
      return await action();
    } finally {
      locked.current = false;
      setPending(false);
      setActiveKey(null);
    }
  }, []);

  return { pending, activeKey, run };
}

export function ButtonSpinner() {
  return (
    <span
      className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
  );
}

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  pendingLabel?: ReactNode;
};

export function ActionButton({
  pending = false,
  pendingLabel,
  children,
  disabled,
  className,
  type = "button",
  ...rest
}: ActionButtonProps) {
  return (
    <button
      type={type}
      {...rest}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={className}
    >
      {pending ? <ButtonSpinner /> : null}
      {pending && pendingLabel != null ? pendingLabel : children}
    </button>
  );
}
