import { useCallback, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { loadPdfFromFile } from "@/pages/editor/lib/pdf";

export type ExamDocStatus = "loading" | "ready" | "error";

export interface ExamDoc {
  id: string;
  fileName: string;
  sourceTitle: string;
  file: File;
  doc: PDFDocumentProxy | null;
  numPages: number;
  status: ExamDocStatus;
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function stripExtension(name: string): string {
  return name.replace(/\.pdf$/i, "");
}

export function useExamDocuments() {
  const [docs, setDocs] = useState<ExamDoc[]>([]);

  const addFiles = useCallback((files: File[]) => {
    const pdfFiles = files.filter(
      (file) =>
        file.type === "application/pdf" || /\.pdf$/i.test(file.name)
    );
    if (pdfFiles.length === 0) return;

    const newDocs: ExamDoc[] = pdfFiles.map((file) => ({
      id: createId(),
      fileName: file.name,
      sourceTitle: stripExtension(file.name),
      file,
      doc: null,
      numPages: 0,
      status: "loading",
    }));

    setDocs((prev) => [...prev, ...newDocs]);

    newDocs.forEach((entry) => {
      loadPdfFromFile(entry.file)
        .then((doc) => {
          setDocs((prev) =>
            prev.map((item) =>
              item.id === entry.id
                ? {
                    ...item,
                    doc,
                    numPages: doc.numPages,
                    status: "ready" as ExamDocStatus,
                  }
                : item
            )
          );
        })
        .catch(() => {
          setDocs((prev) =>
            prev.map((item) =>
              item.id === entry.id
                ? { ...item, status: "error" as ExamDocStatus }
                : item
            )
          );
        });
    });
  }, []);

  const updateSourceTitle = useCallback((id: string, title: string) => {
    setDocs((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, sourceTitle: title } : item
      )
    );
  }, []);

  const removeDoc = useCallback((id: string) => {
    setDocs((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setDocs([]);
  }, []);

  return { docs, addFiles, updateSourceTitle, removeDoc, clearAll };
}