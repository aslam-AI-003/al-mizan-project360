"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";

export type PickerOption = { value: string; label: string; hint?: string };

/**
 * One dropdown style for the whole app.
 *
 * - Tap shows the FULL list (unlike <datalist>, which shows nothing on iPhone until you type).
 * - Phone: opens as a bottom sheet so the keyboard never covers the list.
 * - Laptop: opens as a popover under the field.
 * - `allowCreate`: typing a name that isn't in the list offers "+ Add …" (used for materials/suppliers).
 * - Works in plain server-action forms via `name` (renders a hidden input), or controlled via value/onChange.
 */
export function Picker({
  options,
  value,
  defaultValue,
  onChange,
  name,
  placeholder = "Select…",
  title,
  allowCreate = false,
  searchable,
  id,
}: {
  options: PickerOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  /** Heading shown at the top of the phone sheet. */
  title?: string;
  allowCreate?: boolean;
  searchable?: boolean;
  id?: string;
}) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = value ?? internal;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const showSearch = searchable ?? (allowCreate || options.length > 7);

  const selected = options.find((o) => o.value === current);
  const display = selected?.label ?? current;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const trimmed = query.trim();
  const canCreate =
    allowCreate && trimmed.length > 0 && !options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase());

  function choose(v: string) {
    if (value === undefined) setInternal(v);
    onChange?.(v);
    setOpen(false);
  }

  function openPicker() {
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === current)));
    setOpen(true);
  }

  // Close on outside click (laptop popover) and Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    if (showSearch) requestAnimationFrame(() => searchRef.current?.focus());
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, showSearch]);

  function onListKey(e: React.KeyboardEvent) {
    const total = filtered.length + (canCreate ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(total - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active < filtered.length) choose(filtered[active].value);
      else if (canCreate) choose(trimmed);
    }
  }

  return (
    <div ref={wrapperRef} className="relative min-w-0">
      {name && <input type="hidden" name={name} value={current} />}
      <button
        id={id}
        type="button"
        className="picker-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openPicker())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openPicker();
          }
        }}
      >
        <span className={`truncate ${display ? "" : "text-black/35"}`}>{display || placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 text-black/40 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {/* Phone: dimmed backdrop behind the bottom sheet. */}
          <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setOpen(false)} />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl
                       md:absolute md:inset-x-0 md:bottom-auto md:top-full md:mt-1 md:max-h-80 md:rounded-xl md:border md:border-black/10 md:pb-0 md:shadow-lg"
            onKeyDown={onListKey}
          >
            <div className="flex items-center justify-between px-4 pb-2 pt-4 md:hidden">
              <p className="text-base font-bold">{title ?? placeholder}</p>
              <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05]" onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {showSearch && (
              <div className="border-b border-black/5 px-3 pb-3 md:p-2">
                <div className="relative">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35" />
                  <input
                    ref={searchRef}
                    className="input pl-9"
                    placeholder={allowCreate ? "Search or type a new name" : "Search"}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActive(0);
                    }}
                    onKeyDown={onListKey}
                  />
                </div>
              </div>
            )}

            <ul id={listId} role="listbox" className="flex-1 overflow-y-auto overscroll-contain py-1">
              {filtered.map((o, i) => {
                const isSelected = o.value === current;
                return (
                  <li key={o.value} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => choose(o.value)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-base md:py-2.5 md:text-sm ${
                        i === active ? "bg-black/[0.04]" : ""
                      }`}
                    >
                      <span className="min-w-0">
                        <span className={`block truncate ${isSelected ? "font-semibold text-brand-navy" : ""}`}>{o.label}</span>
                        {o.hint && <span className="block truncate text-[13px] text-black/45 md:text-xs">{o.hint}</span>}
                      </span>
                      {isSelected && <Check size={16} className="shrink-0 text-brand-navy" />}
                    </button>
                  </li>
                );
              })}
              {canCreate && (
                <li>
                  <button
                    type="button"
                    onClick={() => choose(trimmed)}
                    onMouseEnter={() => setActive(filtered.length)}
                    className={`flex w-full items-center gap-2 px-4 py-3.5 text-left text-base font-semibold text-brand-navy md:py-2.5 md:text-sm ${
                      active === filtered.length ? "bg-black/[0.04]" : ""
                    }`}
                  >
                    <Plus size={16} /> Add “{trimmed}”
                  </button>
                </li>
              )}
              {filtered.length === 0 && !canCreate && (
                <li className="px-4 py-6 text-center text-sm text-black/40">
                  {allowCreate ? "Type a name to add it." : "No matches."}
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
