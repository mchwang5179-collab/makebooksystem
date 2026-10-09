import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import PdfPage from "@/pages/editor/components/PdfPage";

interface PdfViewerProps {
  doc: PDFDocumentProxy;
  numPages: number;
  sourceTitle: string;
  selectMode: boolean;
  onToggleSelectMode: () => void;
  onCrop: (crop: { imageDataUrl: string; pageNumber: number }) => void;
}

export default function PdfViewer({
  doc,
  numPages,
  sourceTitle,
  selectMode,
  onToggleSelectMode,
  onCrop,
}: PdfViewerProps) {
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // 지금 화면에 가장 크게 보이는 페이지를 추적한다.
  useEffect(() => {
    const elements = pageRefs.current.filter(Boolean) as HTMLDivElement[];
    if (elements.length === 0) return;

    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => ratios.set(entry.target, entry.intersectionRatio));
        let bestPage = 0;
        let bestRatio = 0;
        ratios.forEach((value, el) => {
          const page = Number((el as HTMLElement).dataset.page);
          if (value > bestRatio) {
            bestRatio = value;
            bestPage = page;
          }
        });
        if (bestPage > 0) setCurrentPage(bestPage);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [numPages, doc]);

  const scrollToPage = useCallback(
    (page: number) => {
      const target = Math.min(Math.max(1, page), numPages);
      setCurrentPage(target);
      pageRefs.current[target - 1]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [numPages]
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-16">
      <div className="sticky top-16 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-md border border-background-200 bg-background-50/95 px-4 py-3 backdrop-blur lg:top-0">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground-900">
          <i className="ri-book-open-line shrink-0 text-primary-600" aria-hidden="true"></i>
          <span className="truncate">{sourceTitle || "제목 없는 시험지"}</span>
          <span className="shrink-0 whitespace-nowrap text-xs text-foreground-500">
            총 {numPages}쪽
          </span>
        </span>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-background-200 p-1">
            <button
              type="button"
              onClick={() => scrollToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              title="이전 페이지"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-foreground-600 transition-colors hover:bg-background-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <i className="ri-arrow-up-s-line text-base" aria-hidden="true"></i>
            </button>
            <span className="flex items-center gap-1 px-1 text-xs text-foreground-700">
              <input
                type="number"
                min={1}
                max={numPages}
                value={currentPage}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (Number.isFinite(next)) scrollToPage(next);
                }}
                className="w-12 rounded-md border border-background-300 bg-background-50 px-1.5 py-1 text-center text-xs text-foreground-950 outline-none focus:border-primary-400"
                aria-label="페이지 번호"
              />
              <span className="whitespace-nowrap text-foreground-500">/ {numPages}</span>
            </span>
            <button
              type="button"
              onClick={() => scrollToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              title="다음 페이지"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-foreground-600 transition-colors hover:bg-background-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <i className="ri-arrow-down-s-line text-base" aria-hidden="true"></i>
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleSelectMode}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors ${
              selectMode
                ? "bg-primary-500 text-background-50 hover:bg-primary-600"
                : "bg-background-200 text-foreground-700 hover:bg-background-300"
            }`}
          >
            <i
              className={selectMode ? "ri-close-line text-sm" : "ri-crop-2-line text-sm"}
              aria-hidden="true"
            ></i>
            {selectMode ? "잘라내기 종료" : "문제 잘라내기"}
          </button>
        </div>
      </div>

      <div
        className={`flex items-start gap-3 rounded-md border px-4 py-3 text-xs leading-relaxed ${
          selectMode
            ? "border-primary-200 bg-primary-50 text-primary-900"
            : "border-accent-200 bg-accent-50 text-accent-900"
        }`}
      >
        <i
          className={`mt-0.5 shrink-0 text-base ${
            selectMode ? "ri-crop-2-line" : "ri-information-line"
          }`}
          aria-hidden="true"
        ></i>
        <span>
          {selectMode
            ? "문제 위를 마우스로 드래그하면 영역이 잘려 오른쪽 목록에 담겨요. 다른 페이지로는 위쪽 페이지 번호로 이동하세요."
            : "‘문제 잘라내기’를 켜면 시험지 위를 드래그해 필요한 문제만 담을 수 있어요."}
        </span>
      </div>

      {Array.from({ length: numPages }, (_, index) => {
        const pageNumber = index + 1;
        return (
          <div
            key={pageNumber}
            data-page={pageNumber}
            ref={(el) => {
              pageRefs.current[index] = el;
            }}
          >
            <PdfPage
              doc={doc}
              pageNumber={pageNumber}
              selectable={selectMode}
              onCrop={onCrop}
            />
          </div>
        );
      })}
    </div>
  );
}