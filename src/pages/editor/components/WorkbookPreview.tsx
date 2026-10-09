import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProblemCrop } from "@/pages/editor/hooks/useProblemCrops";
import {
  groupCropsByUnit,
  renderUnitWorkbookPages,
  renderUnitAnswerPages,
  UNASSIGNED_UNIT,
  type UnitGroup,
} from "@/pages/editor/lib/workbookRender";
import {
  downloadCanvasesAsPdf,
  sanitizeFileName,
} from "@/pages/editor/lib/pdfExport";

interface WorkbookPreviewProps {
  crops: ProblemCrop[];
  title: string;
  unitOrder: string[];
  onClose: () => void;
}

type Tab = "workbook" | "answer";

export default function WorkbookPreview({
  crops,
  title,
  unitOrder,
  onClose,
}: WorkbookPreviewProps) {
  const groups = useMemo(
    () => groupCropsByUnit(crops, unitOrder),
    [crops, unitOrder]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState<Tab>("workbook");
  const [loading, setLoading] = useState(true);
  const [workbookImages, setWorkbookImages] = useState<string[]>([]);
  const [answerImages, setAnswerImages] = useState<string[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const workbookCanvases = useRef<HTMLCanvasElement[]>([]);
  const answerCanvases = useRef<HTMLCanvasElement[]>([]);

  useEffect(() => {
    if (activeIndex > groups.length - 1) {
      setActiveIndex(Math.max(0, groups.length - 1));
    }
  }, [groups.length, activeIndex]);

  const activeGroup = groups[activeIndex];

  useEffect(() => {
    let cancelled = false;

    if (!activeGroup) {
      workbookCanvases.current = [];
      answerCanvases.current = [];
      setWorkbookImages([]);
      setAnswerImages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    renderUnitWorkbookPages(activeGroup.crops, {
      title,
      unitName: activeGroup.unit,
    })
      .then((wb) => {
        if (cancelled) return;
        const ans = renderUnitAnswerPages(activeGroup.crops, {
          title,
          unitName: activeGroup.unit,
        });
        workbookCanvases.current = wb;
        answerCanvases.current = ans;
        setWorkbookImages(wb.map((c) => c.toDataURL("image/png")));
        setAnswerImages(ans.map((c) => c.toDataURL("image/png")));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeGroup, title]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const baseName = sanitizeFileName(title, "문제집");

  const unitFileName = useCallback(
    (unit: string, answer: boolean) =>
      `${baseName}_${sanitizeFileName(unit, UNASSIGNED_UNIT)}${
        answer ? "_정답" : ""
      }.pdf`,
    [baseName]
  );

  const downloadUnit = useCallback(
    async (group: UnitGroup, kind: Tab) => {
      const key = `${group.unit}__${kind}`;
      setBusyKey(key);
      try {
        const wb = await renderUnitWorkbookPages(group.crops, {
          title,
          unitName: group.unit,
        });
        const ans = renderUnitAnswerPages(group.crops, {
          title,
          unitName: group.unit,
        });
        downloadCanvasesAsPdf(
          kind === "workbook" ? wb : ans,
          unitFileName(group.unit, kind === "answer")
        );
      } finally {
        setBusyKey(null);
      }
    },
    [title, unitFileName]
  );

  const handleDownloadActive = useCallback(() => {
    if (!activeGroup) return;
    const canvases =
      tab === "workbook" ? workbookCanvases.current : answerCanvases.current;
    downloadCanvasesAsPdf(canvases, unitFileName(activeGroup.unit, tab === "answer"));
  }, [activeGroup, tab, unitFileName]);

  const images = tab === "workbook" ? workbookImages : answerImages;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-foreground-950/60 backdrop-blur-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-background-200 bg-background-50 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-500 text-background-50">
            <i className="ri-file-pdf-2-line text-lg" aria-hidden="true"></i>
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-heading text-base font-bold text-foreground-950">
              {title.trim() || "문제집"} 단원별 저장
            </h2>
            <p className="text-xs text-foreground-500">
              단원 {groups.length}개 · 문제 {crops.length}개 · 단원마다 1번부터
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-background-200 p-1">
            <button
              type="button"
              onClick={() => setTab("workbook")}
              className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === "workbook"
                  ? "bg-primary-500 text-background-50"
                  : "text-foreground-600 hover:text-foreground-900"
              }`}
            >
              문제집
            </button>
            <button
              type="button"
              onClick={() => setTab("answer")}
              className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === "answer"
                  ? "bg-primary-500 text-background-50"
                  : "text-foreground-600 hover:text-foreground-900"
              }`}
            >
              답지
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadActive}
            disabled={loading || !activeGroup}
            className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-500 px-3 py-2 text-xs font-medium text-background-50 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <i className="ri-download-2-line text-sm" aria-hidden="true"></i>
            이 단원 {tab === "workbook" ? "문제" : "답지"} 저장
          </button>

          <button
            type="button"
            onClick={onClose}
            title="닫기"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-foreground-500 transition-colors hover:bg-background-200 hover:text-foreground-900"
          >
            <i className="ri-close-line text-lg" aria-hidden="true"></i>
          </button>
        </div>
      </header>

      {groups.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-background-100 text-foreground-500">
          <i className="ri-file-line text-3xl" aria-hidden="true"></i>
          <span className="text-sm">담은 문제가 없어요.</span>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          <aside className="w-full shrink-0 overflow-y-auto border-b border-background-200 bg-background-50 p-3 md:w-72 md:border-b-0 md:border-r">
            <p className="mb-2 px-1 text-xs font-semibold text-foreground-600">
              단원별 저장
            </p>
            <ul className="space-y-1.5">
              {groups.map((group, index) => {
                const selected = index === activeIndex;
                return (
                  <li
                    key={group.unit}
                    className={`rounded-lg border p-2 transition-colors ${
                      selected
                        ? "border-primary-300 bg-primary-50"
                        : "border-background-200 bg-background-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className="flex w-full cursor-pointer items-center justify-between gap-2"
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            selected
                              ? "bg-primary-500 text-background-50"
                              : "bg-background-200 text-foreground-600"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="truncate text-xs font-medium text-foreground-800">
                          {group.unit}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-background-200 px-2 py-0.5 text-[11px] text-foreground-600">
                        {group.crops.length}문제
                      </span>
                    </button>
                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => downloadUnit(group, "workbook")}
                        disabled={busyKey === `${group.unit}__workbook`}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-md bg-secondary-100 px-2 py-1.5 text-[11px] font-medium text-secondary-900 transition-colors hover:bg-secondary-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <i className="ri-download-2-line text-xs" aria-hidden="true"></i>
                        {busyKey === `${group.unit}__workbook` ? "저장 중" : "문제 PDF"}
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadUnit(group, "answer")}
                        disabled={busyKey === `${group.unit}__answer`}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-md bg-accent-100 px-2 py-1.5 text-[11px] font-medium text-accent-900 transition-colors hover:bg-accent-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <i className="ri-download-2-line text-xs" aria-hidden="true"></i>
                        {busyKey === `${group.unit}__answer` ? "저장 중" : "답지 PDF"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="flex-1 overflow-y-auto bg-background-100 px-4 py-6 md:px-6">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-foreground-500">
                <i className="ri-loader-4-line animate-spin text-3xl" aria-hidden="true"></i>
                <span className="text-sm">문제집을 만드는 중이에요…</span>
              </div>
            ) : images.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-foreground-500">
                <i className="ri-file-line text-3xl" aria-hidden="true"></i>
                <span className="text-sm">표시할 내용이 없어요.</span>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 pb-6">
                {images.map((src, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-foreground-500">
                      {tab === "workbook" ? "문제집" : "답지"} ·{" "}
                      {activeGroup?.unit} · {index + 1}쪽
                    </span>
                    <div
                      className="w-full overflow-hidden rounded-md border border-background-300 bg-white"
                      style={{ aspectRatio: "210 / 297" }}
                    >
                      <img
                        src={src}
                        alt={`${index + 1}쪽 미리보기`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}