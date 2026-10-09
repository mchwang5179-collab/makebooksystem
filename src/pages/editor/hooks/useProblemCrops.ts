import { useCallback, useState } from "react";

export interface ProblemCrop {
  id: string;
  imageDataUrl: string;
  /** 저장된 문제라면 스토리지 안의 이미지 경로. 새로 잘라낸 문제는 비어 있다. */
  imagePath?: string;
  sourceTitle: string;
  pageNumber: number;
  unitName: string;
  answer: string;
  createdAt: number;
}

export interface NewCropInput {
  imageDataUrl: string;
  sourceTitle: string;
  pageNumber: number;
  unitName?: string;
}

export interface WorkbookSnapshot {
  crops: ProblemCrop[];
  unitOrder: string[];
}

const EMPTY_UNIT_KEY = "\uFFFF";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `crop-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function dedupeOrder(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  list.forEach((item) => {
    const value = item.trim();
    if (!value || seen.has(value)) return;
    seen.add(value);
    out.push(value);
  });
  return out;
}

export function useProblemCrops() {
  const [crops, setCrops] = useState<ProblemCrop[]>([]);
  // 단원명이 입력된 적이 있으면 모두 보관한다(문제가 없어도 드롭다운에 남는다).
  const [unitOrder, setUnitOrder] = useState<string[]>([]);

  const rememberUnit = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setUnitOrder((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  }, []);

  const addCrop = useCallback(
    (input: NewCropInput) => {
      const crop: ProblemCrop = {
        id: createId(),
        imageDataUrl: input.imageDataUrl,
        sourceTitle: input.sourceTitle,
        pageNumber: input.pageNumber,
        unitName: input.unitName ?? "",
        answer: "",
        createdAt: Date.now(),
      };
      setCrops((prev) => [...prev, crop]);
      if (crop.unitName.trim()) rememberUnit(crop.unitName);
      return crop.id;
    },
    [rememberUnit]
  );

  const updateUnitName = useCallback((id: string, unitName: string) => {
    setCrops((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unitName } : item))
    );
  }, []);

  const renameUnit = useCallback((oldName: string, newName: string) => {
    const target = oldName.trim();
    if (!target) return;
    const next = newName.trim();
    setCrops((prev) =>
      prev.map((item) =>
        item.unitName.trim() === target ? { ...item, unitName: next } : item
      )
    );
    setUnitOrder((prev) => dedupeOrder(prev.map((u) => (u === target ? next : u))));
  }, []);

  const clearUnit = useCallback((unitName: string) => {
    const target = unitName.trim();
    if (!target) return;
    // 문제들의 단원 지정만 해제하고, 단원 이름은 드롭다운 목록에 남겨둔다.
    setCrops((prev) =>
      prev.map((item) =>
        item.unitName.trim() === target ? { ...item, unitName: "" } : item
      )
    );
  }, []);

  const updateAnswer = useCallback((id: string, answer: string) => {
    setCrops((prev) =>
      prev.map((item) => (item.id === id ? { ...item, answer } : item))
    );
  }, []);

  const removeCrop = useCallback((id: string) => {
    setCrops((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const moveCrop = useCallback((id: string, direction: "up" | "down") => {
    setCrops((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const sortByUnit = useCallback((orderOverride?: string[]) => {
    setCrops((prev) => {
      const order: string[] = [];
      const map = new Map<string, ProblemCrop[]>();
      prev.forEach((crop) => {
        const key = crop.unitName.trim() || EMPTY_UNIT_KEY;
        if (!map.has(key)) {
          map.set(key, []);
          order.push(key);
        }
        map.get(key)?.push(crop);
      });
      order.sort((a, b) => {
        if (a === EMPTY_UNIT_KEY) return 1;
        if (b === EMPTY_UNIT_KEY) return -1;
        const ia = orderOverride?.indexOf(a) ?? -1;
        const ib = orderOverride?.indexOf(b) ?? -1;
        if (ia !== -1 || ib !== -1) {
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        }
        return a.localeCompare(b, "ko");
      });
      return order.flatMap((key) => map.get(key) ?? []);
    });
  }, []);

  // "단원 관리" 패널에서 문제가 담긴 단원의 순서를 위/아래로 조정한다.
  const moveUnit = useCallback(
    (name: string, direction: "up" | "down") => {
      const target = name.trim();
      if (!target) return;
      setUnitOrder((prev) => {
        const counts = new Map<string, number>();
        crops.forEach((crop) => {
          const key = crop.unitName.trim();
          if (!key) return;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        });

        const visible = prev.filter((u) => counts.has(u));
        Array.from(counts.keys())
          .filter((u) => !prev.includes(u))
          .sort((a, b) => a.localeCompare(b, "ko"))
          .forEach((u) => visible.push(u));

        const index = visible.indexOf(target);
        if (index === -1) return prev;
        const next = direction === "up" ? index - 1 : index + 1;
        if (next < 0 || next >= visible.length) return prev;

        const reordered = [...visible];
        [reordered[index], reordered[next]] = [reordered[next], reordered[index]];

        const rest = prev.filter((u) => !reordered.includes(u));
        return [...reordered, ...rest];
      });
    },
    [crops]
  );

  const clearCrops = useCallback(() => {
    setCrops([]);
  }, []);

  // 저장된 문제집을 불러올 때 상태를 통째로 교체한다.
  const replaceAll = useCallback((snapshot: WorkbookSnapshot) => {
    setCrops(snapshot.crops);
    setUnitOrder(dedupeOrder(snapshot.unitOrder));
  }, []);

  return {
    crops,
    unitOrder,
    addCrop,
    rememberUnit,
    updateUnitName,
    renameUnit,
    clearUnit,
    updateAnswer,
    removeCrop,
    moveCrop,
    moveUnit,
    sortByUnit,
    clearCrops,
    replaceAll,
  };
}