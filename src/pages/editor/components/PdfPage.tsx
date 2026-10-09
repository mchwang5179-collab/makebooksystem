import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { renderPageToCanvas } from "@/pages/editor/lib/pdf";

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PdfPageProps {
  doc: PDFDocumentProxy;
  pageNumber: number;
  scale?: number;
  selectable?: boolean;
  onCrop?: (crop: { imageDataUrl: string; pageNumber: number }) => void;
}

const MIN_SIZE = 16;
// 화면 근처에 들어오면 그때 렌더링한다(대용량 PDF 메모리 절약).
const RENDER_MARGIN = "900px 0px";

export default function PdfPage({
  doc,
  pageNumber,
  scale = 2,
  selectable = false,
  onCrop,
}: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const [ratio, setRatio] = useState<number | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [drag, setDrag] = useState<CropRect | null>(null);
  const [dragging, setDragging] = useState(false);

  // 실제 렌더 전에도 자리를 잡아 둘 수 있도록 페이지 비율만 먼저 구한다.
  useEffect(() => {
    let cancelled = false;
    doc
      .getPage(pageNumber)
      .then((page) => {
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1 });
        setRatio(viewport.width / viewport.height);
      })
      .catch(() => {
        /* 비율을 못 구하면 기본 여백으로 표시 */
      });
    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber]);

  // 화면에 가까워지면 렌더링 대상으로 표시한다.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || shouldRender) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setShouldRender(true);
        });
      },
      { rootMargin: RENDER_MARGIN }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldRender]);

  useEffect(() => {
    if (!shouldRender) return;
    let cancelled = false;
    let task: RenderTask | null = null;
    const run = async () => {
      setStatus("loading");
      try {
        const page = await doc.getPage(pageNumber);
        if (cancelled || !canvasRef.current) return;
        task = renderPageToCanvas(page, canvasRef.current, scale);
        await task.promise;
        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && err.name === "RenderingCancelledException") return;
        setStatus("error");
      }
    };
    run();

    return () => {
      cancelled = true;
      if (task) {
        try {
          task.cancel();
        } catch {
          /* ignore */
        }
      }
    };
  }, [doc, pageNumber, scale, shouldRender]);

  const getPos = (clientX: number, clientY: number) => {
    const el = overlayRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: Math.min(Math.max(0, clientX - rect.left), rect.width),
      y: Math.min(Math.max(0, clientY - rect.top), rect.height),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selectable || status !== "ready") return;
    e.preventDefault();
    const { x, y } = getPos(e.clientX, e.clientY);
    startRef.current = { x, y };
    setDragging(true);
    setDrag({ x, y, w: 0, h: 0 });
    overlayRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !startRef.current) return;
    const { x, y } = getPos(e.clientX, e.clientY);
    const start = startRef.current;
    setDrag({
      x: Math.min(start.x, x),
      y: Math.min(start.y, y),
      w: Math.abs(x - start.x),
      h: Math.abs(y - start.y),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    try {
      overlayRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    startRef.current = null;

    const rect = drag;
    if (!rect || rect.w < MIN_SIZE || rect.h < MIN_SIZE) {
      setDrag(null);
      return;
    }

    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (canvas && overlay) {
      const bounds = overlay.getBoundingClientRect();
      const ratioX = canvas.width / bounds.width;
      const ratioY = canvas.height / bounds.height;
      const sx = Math.round(rect.x * ratioX);
      const sy = Math.round(rect.y * ratioY);
      const sw = Math.max(1, Math.round(rect.w * ratioX));
      const sh = Math.max(1, Math.round(rect.h * ratioY));

      const out = document.createElement("canvas");
      out.width = sw;
      out.height = sh;
      const ctx = out.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
        const dataUrl = out.toDataURL("image/png");
        onCrop?.({ imageDataUrl: dataUrl, pageNumber });
      }
    }
    setDrag(null);
  };

  const ready = status === "ready";

  return (
    <div className="relative w-full min-w-0">
      <div className="mb-2 flex items-center gap-2 text-xs text-foreground-500">
        <i className="ri-file-line" aria-hidden="true"></i>
        <span>{pageNumber}쪽</span>
      </div>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-md border border-background-200 bg-background-50"
        style={
          ready
            ? undefined
            : {
                aspectRatio: ratio ? `${ratio}` : undefined,
                minHeight: ratio ? undefined : "40vh",
              }
        }
      >
        {(!ready || status === "loading") && (
          <div className="absolute inset-0 flex items-center justify-center bg-background-100">
            {status === "error" ? (
              <div className="flex flex-col items-center justify-center gap-2 text-foreground-500">
                <i className="ri-error-warning-line text-2xl" aria-hidden="true"></i>
                <span className="text-sm">이 페이지를 표시할 수 없어요</span>
              </div>
            ) : (
              <i
                className="ri-loader-4-line animate-spin text-2xl text-foreground-400"
                aria-hidden="true"
              ></i>
            )}
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`block h-auto w-full ${ready ? "" : "invisible"}`}
        />
        <div
          ref={overlayRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`absolute inset-0 ${
            selectable ? "cursor-crosshair touch-none" : "pointer-events-none"
          }`}
        >
          {drag && (
            <div
              className="pointer-events-none absolute border-2 border-primary-500 bg-primary-500/20"
              style={{
                left: `${drag.x}px`,
                top: `${drag.y}px`,
                width: `${drag.w}px`,
                height: `${drag.h}px`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}