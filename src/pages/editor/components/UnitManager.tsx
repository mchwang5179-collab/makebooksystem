import { useMemo, useState } from "react";
import type { ProblemCrop } from "@/pages/editor/hooks/useProblemCrops";

interface UnitManagerProps {
  crops: ProblemCrop[];
  unitOrder: string[];
  onRenameUnit: (oldName: string, newName: string) => void;
  onClearUnit: (unitName: string) => void;
  onMoveUnit: (unitName: string, direction: "up" | "down") => void;
}

export default function UnitManager({
  crops,
  unitOrder,
  onRenameUnit,
  onClearUnit,
  onMoveUnit,
}: UnitManagerProps) {
  const [open, setOpen] = useState(true);
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const { units, unassigned } = useMemo(() => {
    const map = new Map<string, number>();
    crops.forEach((crop) => {
      const name = crop.unitName.trim();
      if (!name) return;
      map.set(name, (map.get(name) ?? 0) + 1);
    });
    const list = Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        const ia = unitOrder.indexOf(a.name);
        const ib = unitOrder.indexOf(b.name);
        if (ia === -1 && ib === -1) return a.name.localeCompare(b.name, "ko");
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    const unassignedCount = crops.filter((crop) => !crop.unitName.trim()).length;
    return { units: list, unassigned: unassignedCount };
  }, [crops, unitOrder]);

  const startEdit = (name: string) => {
    setEditingUnit(name);
    setDraft(name);
  };

  const cancelEdit = () => {
    setEditingUnit(null);
    setDraft("");
  };

  const commitEdit = () => {
    if (editingUnit === null) return;
    const next = draft.trim();
    if (next && next !== editingUnit) {
      onRenameUnit(editingUnit, next);
    }
    cancelEdit();
  };

  return (
    <div className="mb-4 rounded-lg border border-background-200 bg-background-50">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2.5"
      >
        <span className="flex min-w-0 items-center gap-2">
          <i
            className="ri-stack-line text-base text-secondary-600"
            aria-hidden="true"
          ></i>
          <span className="text-xs font-semibold text-foreground-800">
            단원 관리
          </span>
          <span className="shrink-0 rounded-full bg-secondary-100 px-2 py-0.5 text-[11px] font-semibold text-secondary-900">
            {units.length}개 단원
          </span>
        </span>
        <i
          className={`ri-arrow-down-s-line shrink-0 text-base text-foreground-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        ></i>
      </button>

      {open && (
        <div className="border-t border-background-200 px-3 py-3">
          {units.length === 0 ? (
            <p className="text-xs leading-relaxed text-foreground-500">
              아직 단원이 없어요. 문제 카드에서 단원명을 고르면 여기에 한눈에
              모여요.
            </p>
          ) : (
            <>
              <p className="mb-2 flex items-center gap-1 text-[11px] text-foreground-500">
                <i className="ri-arrow-up-down-line" aria-hidden="true"></i>
                위/아래 버튼으로 단원 순서를 정하세요. 그 순서대로 PDF가 저장돼요.
              </p>
              <ul className="space-y-1.5">
                {units.map((unit, index) => (
                  <li
                    key={unit.name}
                    className="rounded-md bg-background-100 px-2.5 py-1.5"
                  >
                    {editingUnit === unit.name ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          type="text"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="min-w-0 flex-1 rounded-md border border-primary-300 bg-background-50 px-2 py-1 text-xs text-foreground-950 outline-none transition-colors focus:border-primary-400"
                        />
                        <button
                          type="button"
                          onClick={commitEdit}
                          title="저장"
                          className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-primary-600 transition-colors hover:bg-primary-100"
                        >
                          <i className="ri-check-line text-sm" aria-hidden="true"></i>
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          title="취소"
                          className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground-500 transition-colors hover:bg-background-200"
                        >
                          <i className="ri-close-line text-sm" aria-hidden="true"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary-200 text-[10px] font-bold text-secondary-900">
                            {index + 1}
                          </span>
                          <span className="truncate text-xs font-medium text-foreground-800">
                            {unit.name}
                          </span>
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          <span className="rounded-full bg-background-200 px-2 py-0.5 text-[11px] text-foreground-600">
                            {unit.count}문제
                          </span>
                          <button
                            type="button"
                            onClick={() => onMoveUnit(unit.name, "up")}
                            disabled={index === 0}
                            title="단원 위로"
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-foreground-500 transition-colors hover:bg-background-200 hover:text-foreground-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <i className="ri-arrow-up-line text-sm" aria-hidden="true"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => onMoveUnit(unit.name, "down")}
                            disabled={index === units.length - 1}
                            title="단원 아래로"
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-foreground-500 transition-colors hover:bg-background-200 hover:text-foreground-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <i className="ri-arrow-down-line text-sm" aria-hidden="true"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(unit.name)}
                            title="이름 바꾸기"
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-foreground-500 transition-colors hover:bg-background-200 hover:text-foreground-900"
                          >
                            <i className="ri-edit-line text-sm" aria-hidden="true"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => onClearUnit(unit.name)}
                            title="단원 지정 해제"
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-foreground-400 transition-colors hover:bg-background-200 hover:text-accent-700"
                          >
                            <i className="ri-close-line text-sm" aria-hidden="true"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {unassigned > 0 && (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-foreground-500">
              <i className="ri-question-line" aria-hidden="true"></i>
              단원 미지정 {unassigned}개
            </p>
          )}
        </div>
      )}
    </div>
  );
}