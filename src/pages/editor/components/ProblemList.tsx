import { useEffect, useMemo, useRef, useState } from "react";
import type { ProblemCrop } from "@/pages/editor/hooks/useProblemCrops";
import UnitSelect from "@/pages/editor/components/UnitSelect";
import UnitManager from "@/pages/editor/components/UnitManager";

interface ProblemListProps {
  crops: ProblemCrop[];
  unitOrder: string[];
  workbookTitle: string;
  onWorkbookTitleChange: (value: string) => void;
  currentUnit: string;
  onCurrentUnitChange: (value: string) => void;
  onRememberUnit: (value: string) => void;
  onUpdateUnitName: (id: string, unitName: string) => void;
  onRenameUnit: (oldName: string, newName: string) => void;
  onClearUnit: (unitName: string) => void;
  onMoveUnit: (unitName: string, direction: "up" | "down") => void;
  onUpdateAnswer: (id: string, answer: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onSortByUnit: () => void;
  onClear: () => void;
  onOpenPreview: () => void;
  onSave: () => void;
  saving: boolean;
  saveError: string | null;
  savedAt: number | null;
  isSaved: boolean;
}

export default function ProblemList({
  crops,
  unitOrder,
  workbookTitle,
  onWorkbookTitleChange,
  currentUnit,
  onCurrentUnitChange,
  onRememberUnit,
  onUpdateUnitName,
  onRenameUnit,
  onClearUnit,
  onMoveUnit,
  onUpdateAnswer,
  onRemove,
  onMove,
  onSortByUnit,
  onClear,
  onOpenPreview,
  onSave,
  saving,
  saveError,
  savedAt,
  isSaved,
}: ProblemListProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const prevCount = useRef(crops.length);

  // 단원별로 각 문제가 그 단원 안에서 몇 번째인지 계산한다.
  const unitNumbers = useMemo(() => {
    const counters = new Map<string, number>();
    const result = new Map<string, number>();
    crops.forEach((crop) => {
      const key = crop.unitName.trim();
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      result.set(crop.id, next);
    });
    return result;
  }, [crops]);

  // 정답을 적어둔 문제 수 — 상단에 진행 상황으로 보여준다.
  const answeredCount = useMemo(
    () => crops.filter((crop) => crop.answer.trim().length > 0).length,
    [crops]
  );

  useEffect(() => {
    if (crops.length > prevCount.current) {
      const last = listRef.current?.lastElementChild as HTMLElement | null;
      last?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    prevCount.current = crops.length;
  }, [crops.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-bold text-foreground-950">
            담은 문제
          </h2>
          <div className="flex items-center gap-1.5">
            {crops.length > 0 && (
              <span
                className={
                  answeredCount === crops.length
                    ? "rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-semibold text-secondary-900"
                    : "rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-semibold text-accent-900"
                }
                title="정답을 적은 문제 수"
              >
                정답 {answeredCount}/{crops.length}
              </span>
            )}
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
              {crops.length}개
            </span>
          </div>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-foreground-500">
          잘라낸 문제에 단원과 정답을 적고 순서를 정리하세요.
        </p>
      </div>

      <div className="mb-3 rounded-lg border border-background-200 bg-background-50 p-3">
        <label
          htmlFor="workbook-title"
          className="mb-1 block text-xs font-medium text-foreground-600"
        >
          문제집 제목
        </label>
        <input
          id="workbook-title"
          type="text"
          value={workbookTitle}
          onChange={(e) => onWorkbookTitleChange(e.target.value)}
          placeholder="예: 고3 수학 기출 모음"
          className="w-full rounded-md border border-background-300 bg-background-50 px-3 py-2 text-sm text-foreground-950 outline-none transition-colors placeholder:text-foreground-400 focus:border-primary-400"
        />
      </div>

      <div className="mb-4 rounded-lg border border-background-200 bg-background-50 p-3">
        <label
          htmlFor="current-unit"
          className="mb-1 block text-xs font-medium text-foreground-600"
        >
          지금 담는 문제의 단원
        </label>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <UnitSelect
              value={currentUnit}
              onChange={onCurrentUnitChange}
              onCommit={onRememberUnit}
              options={unitOrder}
              placeholder="예: 미적분 - 극한"
              size="md"
            />
          </div>
          <button
            type="button"
            onClick={onSortByUnit}
            disabled={crops.length < 2}
            title="단원별로 묶어 정렬"
            className="flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-md bg-secondary-100 px-2.5 py-2 text-xs font-medium text-secondary-900 transition-colors hover:bg-secondary-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <i className="ri-sort-desc text-sm" aria-hidden="true"></i>
            단원별 정렬
          </button>
        </div>
        <p className="mt-1.5 text-xs text-foreground-500">
          적어두면 새로 담는 문제에 자동으로 들어가요.
        </p>
      </div>

      <UnitManager
        crops={crops}
        unitOrder={unitOrder}
        onRenameUnit={onRenameUnit}
        onClearUnit={onClearUnit}
        onMoveUnit={onMoveUnit}
      />

      {crops.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-background-100 px-4 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background-200 text-foreground-500">
            <i className="ri-crop-2-line text-2xl" aria-hidden="true"></i>
          </span>
          <p className="mt-4 text-sm font-medium text-foreground-800">
            아직 담은 문제가 없어요
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-foreground-500">
            가운데에서 &lsquo;문제 잘라내기&rsquo;를 켜고
            <br />
            PDF 위를 드래그해 보세요.
          </p>
        </div>
      ) : (
        <>
          <ul ref={listRef} className="flex-1 space-y-3">
            {crops.map((crop, index) => {
              const number = unitNumbers.get(crop.id) || 0;
              return (
                <li
                  key={crop.id}
                  className="rounded-lg border border-background-200 bg-background-50 p-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-background-50">
                      {number}
                    </span>
                    <div className="h-24 flex-1 overflow-hidden rounded-md border border-background-200 bg-background-100">
                      <img
                        src={crop.imageDataUrl}
                        alt={`${index + 1}번 문제 미리보기`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex shrink-0 flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => onMove(crop.id, "up")}
                        disabled={index === 0}
                        title="위로"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-foreground-500 transition-colors hover:bg-background-200 hover:text-foreground-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <i className="ri-arrow-up-line text-base" aria-hidden="true"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => onMove(crop.id, "down")}
                        disabled={index === crops.length - 1}
                        title="아래로"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-foreground-500 transition-colors hover:bg-background-200 hover:text-foreground-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <i
                          className="ri-arrow-down-line text-base"
                          aria-hidden="true"
                        ></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(crop.id)}
                        title="삭제"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-foreground-400 transition-colors hover:bg-background-200 hover:text-accent-700"
                      >
                        <i
                          className="ri-delete-bin-6-line text-base"
                          aria-hidden="true"
                        ></i>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <UnitSelect
                      value={crop.unitName}
                      onChange={(value) => onUpdateUnitName(crop.id, value)}
                      onCommit={onRememberUnit}
                      options={unitOrder}
                      placeholder="단원명 (선택)"
                    />
                  </div>

                  <textarea
                    value={crop.answer}
                    onChange={(e) => onUpdateAnswer(crop.id, e.target.value)}
                    placeholder="정답 / 해설을 바로 적어 주세요"
                    rows={2}
                    className="mt-2 w-full resize-y rounded-md border border-background-300 bg-background-50 px-3 py-2 text-xs leading-relaxed text-foreground-950 outline-none transition-colors placeholder:text-foreground-400 focus:border-primary-400"
                  />

                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <div className="flex min-w-0 items-center gap-1 text-foreground-500">
                      <i className="ri-price-tag-3-line" aria-hidden="true"></i>
                      <span className="truncate">
                        {crop.sourceTitle || "출처 없음"}
                      </span>
                    </div>
                    {crop.answer.trim().length > 0 ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary-100 px-2 py-0.5 font-medium text-secondary-900">
                        <i className="ri-check-line" aria-hidden="true"></i>
                        정답 입력
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 font-medium text-accent-900">
                        <i
                          className="ri-error-warning-line"
                          aria-hidden="true"
                        ></i>
                        미입력
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 space-y-2 border-t border-background-200 pt-4">
            {saveError && (
              <p className="rounded-md bg-accent-50 px-3 py-2 text-xs text-accent-900">
                {saveError}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={saving || crops.length === 0}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-primary-300 bg-background-50 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i
                  className={saving ? "ri-loader-4-line animate-spin text-base" : "ri-save-3-line text-base"}
                  aria-hidden="true"
                ></i>
                {saving ? "저장 중…" : isSaved ? "변경 저장" : "문제집 저장"}
              </button>
              <button
                type="button"
                onClick={onOpenPreview}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-primary-500 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600"
              >
                <i className="ri-layout-grid-line text-base" aria-hidden="true"></i>
                미리보기 &amp; PDF
              </button>
            </div>
            {savedAt && !saveError && (
              <p className="flex items-center gap-1 text-xs text-foreground-500">
                <i className="ri-check-line text-secondary-600" aria-hidden="true"></i>
                {new Date(savedAt).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                에 계정에 저장됐어요
              </p>
            )}

            {confirmClear ? (
              <div className="flex items-center justify-between gap-2 rounded-md bg-accent-50 px-3 py-2">
                <span className="text-xs text-accent-900">
                  담은 문제를 모두 지울까요?
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="cursor-pointer whitespace-nowrap rounded-md bg-background-200 px-2.5 py-1 text-xs font-medium text-foreground-700 transition-colors hover:bg-background-300"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClear();
                      setConfirmClear(false);
                    }}
                    className="cursor-pointer whitespace-nowrap rounded-md bg-accent-600 px-2.5 py-1 text-xs font-medium text-background-50 transition-colors hover:bg-accent-700"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-background-300 bg-background-50 py-2 text-xs font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-foreground-900"
              >
                <i className="ri-delete-bin-6-line text-sm" aria-hidden="true"></i>
                전체 삭제
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}