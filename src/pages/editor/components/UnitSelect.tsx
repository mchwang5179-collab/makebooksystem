import { useEffect, useMemo, useRef, useState } from "react";

interface UnitSelectProps {
  value: string;
  onChange: (value: string) => void;
  onCommit?: (value: string) => void;
  options: string[];
  placeholder?: string;
  size?: "sm" | "md";
}

export default function UnitSelect({
  value,
  onChange,
  onCommit,
  options,
  placeholder = "단원명 (선택)",
  size = "sm",
}: UnitSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const uniqueOptions = useMemo(
    () => Array.from(new Set(options.map((item) => item.trim()).filter(Boolean))),
    [options]
  );

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return uniqueOptions;
    return uniqueOptions.filter((item) => item.toLowerCase().includes(query));
  }, [uniqueOptions, value]);

  const sizeClasses =
    size === "md" ? "px-3 py-2 text-sm" : "px-3 py-2 text-xs";

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (onCommit) onCommit(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (onCommit) onCommit(value);
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className={`w-full rounded-md border border-background-300 bg-background-50 pr-9 text-foreground-950 outline-none transition-colors placeholder:text-foreground-400 focus:border-primary-400 ${sizeClasses}`}
      />
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title="단원 목록 보기"
        aria-label="단원 목록 보기"
        className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-foreground-500 transition-colors hover:bg-background-200 hover:text-foreground-900"
      >
        <i
          className={`ri-arrow-down-s-line text-base transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        ></i>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-md border border-background-200 bg-background-50">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs leading-relaxed text-foreground-500">
              {value.trim()
                ? "일치하는 단원이 없어요. 새로 입력돼요."
                : "아직 입력한 단원이 없어요."}
            </p>
          ) : (
            <ul className="max-h-48 overflow-y-auto py-1">
              {filtered.map((option) => {
                const active = option === value.trim();
                return (
                  <li key={option}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onChange(option);
                        if (onCommit) onCommit(option);
                        setOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                        active
                          ? "bg-primary-50 font-semibold text-primary-700"
                          : "text-foreground-800 hover:bg-background-100"
                      }`}
                    >
                      <span className="truncate">{option}</span>
                      {active && (
                        <i
                          className="ri-check-line shrink-0 text-sm text-primary-600"
                          aria-hidden="true"
                        ></i>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}