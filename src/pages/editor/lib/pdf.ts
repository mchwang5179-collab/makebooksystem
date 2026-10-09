import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/** Load a PDF document from a File object. */
export async function loadPdfFromFile(file: File): Promise<PDFDocumentProxy> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  return loadingTask.promise;
}

/**
 * Render a single PDF page onto a canvas at the given scale.
 * Returns the render task so callers can cancel in-flight renders.
 */
export function renderPageToCanvas(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number
): RenderTask {
  const viewport = page.getViewport({ scale });
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context is not available.");
  }
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const params = {
    canvasContext: context,
    canvas,
    viewport,
  } as unknown as Parameters<typeof page.render>[0];

  return page.render(params);
}

export type { PDFDocumentProxy, PDFPageProxy, RenderTask };