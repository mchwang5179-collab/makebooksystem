import type { ProblemCrop } from "@/pages/editor/hooks/useProblemCrops";

/** A4 비율/해상도 상수 (mm → px) */
export const PAGE_W_MM = 210;
export const PAGE_H_MM = 297;
const MM = 8;
const PAGE_W = PAGE_W_MM * MM;
const PAGE_H = PAGE_H_MM * MM;

const MARGIN = 12 * MM;
const HEADER_H = 14 * MM;
const GRID_GAP = 6 * MM;
const COLS = 2;
const ROWS = 2;
const PER_PAGE = COLS * ROWS;

const FONT = '"Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const INK = "#111827";
const MUTED = "#6b7280";
const LINE = "#d1d5db";
const SOFT = "#f3f4f6";

/** 단원이 지정되지 않은 문제들을 묶는 이름 */
export const UNASSIGNED_UNIT = "미지정";

export interface UnitGroup {
  unit: string;
  crops: ProblemCrop[];
}

/** 문제들을 단원별로 묶고, 지정된 단원 순서대로 정렬한다. (미지정은 항상 마지막) */
export function groupCropsByUnit(
  crops: ProblemCrop[],
  unitOrder: string[]
): UnitGroup[] {
  const map = new Map<string, ProblemCrop[]>();
  crops.forEach((crop) => {
    const key = crop.unitName.trim() || UNASSIGNED_UNIT;
    if (!map.has(key)) map.set(key, []);
    map.get(key)?.push(crop);
  });

  const groups: UnitGroup[] = [];

  unitOrder.forEach((name) => {
    const key = name.trim();
    if (!key || key === UNASSIGNED_UNIT) return;
    const items = map.get(key);
    if (items && items.length > 0) {
      groups.push({ unit: key, crops: items });
      map.delete(key);
    }
  });

  Array.from(map.keys())
    .filter((key) => key !== UNASSIGNED_UNIT)
    .sort((a, b) => a.localeCompare(b, "ko"))
    .forEach((key) => {
      groups.push({ unit: key, crops: map.get(key) ?? [] });
      map.delete(key);
    });

  const unassigned = map.get(UNASSIGNED_UNIT);
  if (unassigned && unassigned.length > 0) {
    groups.push({ unit: UNASSIGNED_UNIT, crops: unassigned });
  }

  return groups;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const value = text ?? "";
  if (ctx.measureText(value).width <= maxWidth) return value;
  let out = "";
  for (const ch of value) {
    if (ctx.measureText(`${out}${ch}…`).width > maxWidth) break;
    out += ch;
  }
  return `${out}…`;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  String(text ?? "")
    .split("\n")
    .forEach((para) => {
      let line = "";
      for (const ch of para) {
        const test = line + ch;
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = ch;
        } else {
          line = test;
        }
      }
      lines.push(line);
    });
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function createPageCanvas(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  return { canvas, ctx };
}

function drawPageHeader(
  ctx: CanvasRenderingContext2D,
  left: string,
  right: string
) {
  ctx.fillStyle = INK;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.font = `700 ${5 * MM}px ${FONT}`;
  ctx.fillText(fitText(ctx, left, PAGE_W - MARGIN * 2 - 26 * MM), MARGIN, MARGIN);

  ctx.fillStyle = MUTED;
  ctx.textAlign = "right";
  ctx.font = `400 ${3.2 * MM}px ${FONT}`;
  ctx.fillText(right, PAGE_W - MARGIN, MARGIN + 1.8 * MM);

  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(MARGIN, MARGIN + HEADER_H);
  ctx.lineTo(PAGE_W - MARGIN, MARGIN + HEADER_H);
  ctx.stroke();
}

export interface UnitRenderOptions {
  title: string;
  unitName: string;
}

function buildHeading(title: string, unitName: string, suffix = ""): string {
  const parts = [title.trim(), unitName.trim()].filter(Boolean);
  const base = parts.join(" · ") || "문제집";
  return suffix ? `${base} ${suffix}` : base;
}

/** 한 단원의 문제들을 A4 4분할(2×2)로 배치한 페이지 캔버스들을 만든다. 번호는 1번부터. */
export async function renderUnitWorkbookPages(
  crops: ProblemCrop[],
  options: UnitRenderOptions
): Promise<HTMLCanvasElement[]> {
  const images = await Promise.all(
    crops.map((crop) => loadImage(crop.imageDataUrl))
  );

  const totalPages = Math.max(1, Math.ceil(crops.length / PER_PAGE));
  const pages: HTMLCanvasElement[] = [];

  const gridTop = MARGIN + HEADER_H + 5 * MM;
  const gridW = PAGE_W - MARGIN * 2;
  const gridH = PAGE_H - gridTop - MARGIN;
  const cellW = (gridW - GRID_GAP) / COLS;
  const cellH = (gridH - GRID_GAP) / ROWS;
  const pad = 3 * MM;

  const heading = buildHeading(options.title, options.unitName);

  for (let page = 0; page < totalPages; page += 1) {
    const { canvas, ctx } = createPageCanvas();
    drawPageHeader(ctx, heading, `${page + 1} / ${totalPages}`);

    const pageCrops = crops.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
    const pageImages = images.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

    for (let slot = 0; slot < PER_PAGE; slot += 1) {
      // 번호 순서: 좌상(1) → 좌하(2) → 우상(3) → 우하(4)  (열 우선)
      const col = Math.floor(slot / ROWS);
      const row = slot % ROWS;
      const x = MARGIN + col * (cellW + GRID_GAP);
      const y = gridTop + row * (cellH + GRID_GAP);

      const crop = pageCrops[slot];
      const img = pageImages[slot];

      ctx.strokeStyle = crop ? LINE : SOFT;
      ctx.lineWidth = 1;
      roundRect(ctx, x + 0.5, y + 0.5, cellW - 1, cellH - 1, 3 * MM);
      ctx.stroke();

      if (!crop) continue;

      // 단원 안에서 1번부터 시작하는 문제 번호
      const number = page * PER_PAGE + slot + 1;
      const headerH = 6.5 * MM;

      ctx.fillStyle = INK;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = `700 ${4.4 * MM}px ${FONT}`;
      ctx.fillText(`${number}.`, x + pad, y + pad);

      ctx.fillStyle = MUTED;
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.font = `400 ${2.5 * MM}px ${FONT}`;
      const source = crop.sourceTitle || "출처 없음";
      ctx.fillText(
        fitText(ctx, source, cellW - pad * 2 - 14 * MM),
        x + cellW - pad,
        y + pad + 1.4 * MM
      );

      // 문제 이미지를 칸 위쪽에 붙여 아래쪽에 풀이 여백을 남긴다.
      const imgX = x + pad;
      const imgY = y + pad + headerH;
      const imgW = cellW - pad * 2;
      const imgH = cellH - (pad + headerH) - pad;

      if (img) {
        const scale = Math.min(imgW / img.width, imgH / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, imgX + (imgW - dw) / 2, imgY, dw, dh);
      }
    }

    pages.push(canvas);
  }

  return pages;
}

/** 한 단원의 정답/해설 페이지 캔버스들을 만든다. 번호는 1번부터. */
export function renderUnitAnswerPages(
  crops: ProblemCrop[],
  options: UnitRenderOptions
): HTMLCanvasElement[] {
  const heading = buildHeading(options.title, options.unitName, "정답 및 해설");
  const pages: HTMLCanvasElement[] = [];

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let pageNumber = 0;
  let y = 0;

  const bottom = PAGE_H - MARGIN;

  const startPage = () => {
    const created = createPageCanvas();
    canvas = created.canvas;
    ctx = created.ctx;
    pageNumber += 1;
    drawPageHeader(ctx, heading, `${pageNumber}`);
    y = MARGIN + HEADER_H + 6 * MM;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > bottom) {
      pages.push(canvas);
      startPage();
    }
  };

  startPage();

  if (crops.length === 0) {
    ctx.fillStyle = MUTED;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `400 ${3.6 * MM}px ${FONT}`;
    ctx.fillText("아직 담은 문제가 없어요.", MARGIN, y);
    pages.push(canvas);
    return pages;
  }

  crops.forEach((crop, index) => {
    const answer = crop.answer.trim() || "정답 미입력";
    const hasAnswer = crop.answer.trim().length > 0;

    const numW = 11 * MM;
    const textW = PAGE_W - MARGIN * 2 - numW;

    ctx.font = `600 ${3.2 * MM}px ${FONT}`;
    const answerLines = wrapText(ctx, answer, textW);

    const metaH = 4.6 * MM;
    const lineH = 5 * MM;
    const blockH = metaH + answerLines.length * lineH + 3 * MM;

    ensureSpace(blockH);

    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `700 ${3.6 * MM}px ${FONT}`;
    ctx.fillText(`${index + 1}.`, MARGIN, y);

    ctx.fillStyle = MUTED;
    ctx.font = `400 ${2.6 * MM}px ${FONT}`;
    const src = crop.sourceTitle || "출처 없음";
    ctx.fillText(fitText(ctx, src, textW), MARGIN + numW, y + 0.6 * MM);

    ctx.fillStyle = hasAnswer ? INK : MUTED;
    ctx.font = `600 ${3.2 * MM}px ${FONT}`;
    answerLines.forEach((line, i) => {
      ctx.fillText(line, MARGIN + numW, y + metaH + i * lineH);
    });

    y += blockH;
  });

  pages.push(canvas);
  return pages;
}