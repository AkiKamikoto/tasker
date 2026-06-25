import { useEffect, useRef, MouseEvent } from "react";

/**
 * Общая логика модалок: закрытие по Escape, закрытие по клику на бэкдроп,
 * автофокус на первое поле. Возвращает ref для первого поля и пропсы бэкдропа.
 */
export function useModal<T extends HTMLElement = HTMLInputElement>(
  onClose: () => void
) {
  const firstFieldRef = useRef<T | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    firstFieldRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const backdropProps = {
    onClick: (e: MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
  };

  return { firstFieldRef, backdropProps };
}
