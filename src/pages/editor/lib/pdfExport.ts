import { jsPDF } from "jspdf";
import { PAGE_W_MM, PAGE_H_MM } from "@/pages/editor/lib/workbookRender";

/** 렌더링된 페이지 캔버스들을 A4 PDF 파일로 저장한다. */
export function downloadCanvasesAsPdf(
  canvases: HTMLCanvasElement[],
  fileName: string
): void {
  if (canvases.length === 0) return;

  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
  });

  canvases.forEach((canvas, index) => {
    if (index > 0) pdf.addPage();
    const data = canvas.toDataURL("image/jpeg", 0.92);
    pdf.addImage(data, "JPEG", 0, 0, PAGE_W_MM, PAGE_H_MM);
  });

  pdf.save(fileName);
}

/** 파일명에 쓸 수 없는 문자를 정리한다. */
export function sanitizeFileName(name: string, fallback: string): string {
  const cleaned = (name || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_");
  return cleaned || fallback;
}