import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "@/components/feature/AppHeader";
import UploadZone from "@/pages/editor/components/UploadZone";
import ExamFileList from "@/pages/editor/components/ExamFileList";
import PdfViewer from "@/pages/editor/components/PdfViewer";
import ProblemList from "@/pages/editor/components/ProblemList";
import WorkbookPreview from "@/pages/editor/components/WorkbookPreview";
import { useExamDocuments } from "@/pages/editor/hooks/useExamDocuments";
import {
  useProblemCrops,
  type ProblemCrop,
} from "@/pages/editor/hooks/useProblemCrops";
import { useUnsavedChangesGuard } from "@/pages/editor/hooks/useUnsavedChangesGuard";
import { loadWorkbook, saveWorkbook } from "@/pages/editor/lib/workbookApi";

/** 저장 시점과 현재 상태를 비교하기 위한 요약 문자열(이미지 데이터는 제외). */
function buildSignature(
  title: string,
  unitOrder: string[],
  crops: ProblemCrop[]
): string {
  return JSON.stringify({
    t: title,
    u: unitOrder,
    c: crops.map((crop) => [crop.id, crop.unitName, crop.answer]),
  });
}

export default function EditorPage() {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();

  const { docs, addFiles, updateSourceTitle, removeDoc } = useExamDocuments();
  const {
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
  } = useProblemCrops();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [currentUnit, setCurrentUnit] = useState("");
  const [workbookTitle, setWorkbookTitle] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const [workbookId, setWorkbookId] = useState<string | null>(routeId ?? null);
  const [loading, setLoading] = useState<boolean>(!!routeId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // 저장된 문제집을 열면 내용을 불러온다.
  useEffect(() => {
    if (!routeId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    loadWorkbook(routeId)
      .then((data) => {
        if (cancelled) return;
        replaceAll({ crops: data.crops, unitOrder: data.unitOrder });
        setWorkbookTitle(data.title);
        setWorkbookId(data.id);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "불러오지 못했어요.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [routeId, replaceAll]);

  const currentSignature = useMemo(
    () => buildSignature(workbookTitle, unitOrder, crops),
    [workbookTitle, unitOrder, crops]
  );

  // 불러오기/첫 진입 시점을 기준선으로 잡아 "저장 안 된 변경"을 판단한다.
  useEffect(() => {
    if (loading) return;
    if (savedSignature !== null) return;
    setSavedSignature(currentSignature);
  }, [loading, savedSignature, currentSignature]);

  const dirty =
    !loading && savedSignature !== null && currentSignature !== savedSignature;

  useUnsavedChangesGuard(dirty, (path) => setPendingPath(path));

  useEffect(() => {
    const stillExists = docs.some((doc) => doc.id === selectedId);
    if (stillExists) return;
    const firstReady = docs.find((doc) => doc.status === "ready");
    setSelectedId(firstReady ? firstReady.id : null);
  }, [docs, selectedId]);

  const selectedDoc = useMemo(
    () => docs.find((doc) => doc.id === selectedId && doc.status === "ready") ?? null,
    [docs, selectedId]
  );

  const handleCrop = useCallback(
    (crop: { imageDataUrl: string; pageNumber: number }) => {
      if (!selectedDoc) return;
      addCrop({
        imageDataUrl: crop.imageDataUrl,
        pageNumber: crop.pageNumber,
        sourceTitle: selectedDoc.sourceTitle,
        unitName: currentUnit.trim(),
      });
    },
    [addCrop, currentUnit, selectedDoc]
  );

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const finalId = await saveWorkbook({
        id: workbookId,
        title: workbookTitle,
        unitOrder,
        crops,
      });
      setWorkbookId(finalId);
      setSavedAt(Date.now());
      setSavedSignature(buildSignature(workbookTitle, unitOrder, crops));
      if (!routeId || routeId !== finalId) {
        navigate(`/editor/${finalId}`, { replace: true });
      }
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }, [saving, workbookId, workbookTitle, unitOrder, crops, routeId, navigate]);

  return (
    <div className="min-h-screen w-full bg-background-50">
      <AppHeader />

      <div className="flex flex-col lg:h-[calc(100vh-4rem)] lg:flex-row lg:overflow-hidden">
        <aside className="w-full shrink-0 border-b border-background-200 p-4 lg:w-[300px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="mb-4">
            <h2 className="font-heading text-lg font-bold text-foreground-950">
              시험지 업로드
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-foreground-500">
              파일마다 출처 제목을 적어두면 문제집에 작은 글씨로 표시돼요.
            </p>
          </div>
          <UploadZone onFiles={addFiles} />
          <ExamFileList
            docs={docs}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdateTitle={updateSourceTitle}
            onRemove={removeDoc}
          />
        </aside>

        <main className="flex-1 bg-background-100 p-4 md:p-6 lg:overflow-y-auto">
          {loading ? (
            <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 text-foreground-500">
              <i className="ri-loader-4-line animate-spin text-3xl" aria-hidden="true"></i>
              <span className="text-sm">문제집을 불러오는 중이에요…</span>
            </div>
          ) : loadError ? (
            <div className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 text-accent-700">
                <i className="ri-error-warning-line text-3xl" aria-hidden="true"></i>
              </span>
              <h3 className="mt-5 font-heading text-lg font-bold text-foreground-950">
                불러오지 못했어요
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground-600">
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="mt-5 cursor-pointer whitespace-nowrap rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-background-50 transition-colors hover:bg-primary-600"
              >
                내 문제집으로 돌아가기
              </button>
            </div>
          ) : selectedDoc && selectedDoc.doc ? (
            <PdfViewer
              doc={selectedDoc.doc}
              numPages={selectedDoc.numPages}
              sourceTitle={selectedDoc.sourceTitle}
              selectMode={selectMode}
              onToggleSelectMode={() => setSelectMode((prev) => !prev)}
              onCrop={handleCrop}
            />
          ) : (
            <div className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-background-200 text-foreground-500">
                <i className="ri-file-pdf-2-line text-3xl" aria-hidden="true"></i>
              </span>
              <h3 className="mt-5 font-heading text-lg font-bold text-foreground-950">
                시험지를 올려 주세요
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground-600">
                왼쪽에서 기출시험지 PDF를 업로드하면 이곳에 시험지가 펼쳐져요.
              </p>
            </div>
          )}
        </main>

        <aside className="w-full shrink-0 border-t border-background-200 p-4 lg:w-[360px] lg:overflow-y-auto lg:border-l lg:border-t-0">
          <ProblemList
            crops={crops}
            unitOrder={unitOrder}
            workbookTitle={workbookTitle}
            onWorkbookTitleChange={setWorkbookTitle}
            currentUnit={currentUnit}
            onCurrentUnitChange={setCurrentUnit}
            onRememberUnit={rememberUnit}
            onUpdateUnitName={updateUnitName}
            onRenameUnit={renameUnit}
            onClearUnit={clearUnit}
            onMoveUnit={moveUnit}
            onUpdateAnswer={updateAnswer}
            onRemove={removeCrop}
            onMove={moveCrop}
            onSortByUnit={() => sortByUnit(unitOrder)}
            onClear={clearCrops}
            onOpenPreview={() => setPreviewOpen(true)}
            onSave={handleSave}
            saving={saving}
            saveError={saveError}
            savedAt={savedAt}
            isSaved={!!workbookId}
          />
        </aside>
      </div>

      {previewOpen && (
        <WorkbookPreview
          crops={crops}
          title={workbookTitle}
          unitOrder={unitOrder}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {pendingPath && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground-950/40 px-4">
          <div className="w-full max-w-sm rounded-lg border border-background-200 bg-background-50 p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 text-accent-700">
                <i className="ri-error-warning-line text-lg" aria-hidden="true"></i>
              </span>
              <h3 className="font-heading text-base font-bold text-foreground-950">
                저장하지 않은 변경사항
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground-600">
              아직 저장하지 않은 작업이 있어요. 지금 페이지를 떠나면 입력한 내용이
              사라질 수 있어요. 저장한 뒤에 이동하는 걸 권장해요.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPendingPath(null)}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 bg-background-50 py-2 text-sm font-medium text-foreground-700 transition-colors hover:bg-background-100"
              >
                <i className="ri-arrow-go-back-line text-base" aria-hidden="true"></i>
                계속 편집
              </button>
              <button
                type="button"
                onClick={() => {
                  const path = pendingPath;
                  setPendingPath(null);
                  navigate(path);
                }}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-accent-600 py-2 text-sm font-semibold text-background-50 transition-colors hover:bg-accent-700"
              >
                <i className="ri-logout-box-r-line text-base" aria-hidden="true"></i>
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}