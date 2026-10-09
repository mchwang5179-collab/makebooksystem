import type { ExamDoc } from "@/pages/editor/hooks/useExamDocuments";

interface ExamFileListProps {
  docs: ExamDoc[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onRemove: (id: string) => void;
}

export default function ExamFileList({
  docs,
  selectedId,
  onSelect,
  onUpdateTitle,
  onRemove,
}: ExamFileListProps) {
  if (docs.length === 0) {
    return (
      <p className="mt-6 rounded-md bg-background-100 px-3 py-4 text-center text-xs leading-relaxed text-foreground-500">
        아직 올린 시험지가 없어요.
        <br />
        위에서 PDF를 올려 주세요.
      </p>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {docs.map((doc, index) => {
        const active = doc.id === selectedId;
        return (
          <li
            key={doc.id}
            className={`rounded-lg border p-3 transition-colors ${
              active
                ? "border-primary-300 bg-primary-50"
                : "border-background-200 bg-background-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => doc.status === "ready" && onSelect(doc.id)}
                className={`flex min-w-0 flex-1 items-center gap-2 text-left ${
                  doc.status === "ready" ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                    active
                      ? "bg-primary-500 text-background-50"
                      : "bg-background-200 text-foreground-600"
                  }`}
                >
                  <i className="ri-file-pdf-2-line text-base" aria-hidden="true"></i>
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground-500">
                      시험지 {index + 1}
                    </span>
                    {doc.status === "loading" && (
                      <i
                        className="ri-loader-4-line animate-spin text-xs text-foreground-400"
                        aria-hidden="true"
                      ></i>
                    )}
                    {doc.status === "error" && (
                      <span className="text-xs text-accent-700">불러오기 실패</span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-foreground-900">
                    {doc.fileName}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(doc.id)}
                title="삭제"
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground-400 transition-colors hover:bg-background-200 hover:text-accent-700"
              >
                <i className="ri-delete-bin-6-line text-base" aria-hidden="true"></i>
              </button>
            </div>

            <div className="mt-3">
              <label
                htmlFor={`source-${doc.id}`}
                className="mb-1 block text-xs font-medium text-foreground-600"
              >
                출처 제목
              </label>
              <input
                id={`source-${doc.id}`}
                type="text"
                value={doc.sourceTitle}
                onChange={(e) => onUpdateTitle(doc.id, e.target.value)}
                placeholder="예: 2023학년도 수능 수학"
                className="w-full rounded-md border border-background-300 bg-background-50 px-3 py-2 text-sm text-foreground-950 outline-none transition-colors focus:border-primary-400 placeholder:text-foreground-400"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}