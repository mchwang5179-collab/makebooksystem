import { supabase } from "@/lib/supabase";
import type { ProblemCrop, WorkbookSnapshot } from "@/pages/editor/hooks/useProblemCrops";

const BUCKET = "workbook-assets";
const SIGNED_URL_TTL = 60 * 60 * 24; // 24시간

export interface WorkbookSummary {
  id: string;
  title: string;
  problemCount: number;
  updatedAt: string;
}

export interface LoadedWorkbook extends WorkbookSnapshot {
  id: string;
  title: string;
}

function fileExtFromMime(mime: string): string {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  return "png";
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("로그인이 필요해요.");
  return data.user.id;
}

/** 내 문제집 목록을 최근 수정 순으로 가져온다. */
export async function listWorkbooks(): Promise<WorkbookSummary[]> {
  const { data, error } = await supabase
    .from("workbooks")
    .select("id, title, updated_at, workbook_problems(count)")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const problems = (row as { workbook_problems?: { count: number }[] })
      .workbook_problems;
    const count = Array.isArray(problems) ? problems[0]?.count ?? 0 : 0;
    return {
      id: row.id as string,
      title: (row.title as string) || "제목 없는 문제집",
      problemCount: count,
      updatedAt: row.updated_at as string,
    };
  });
}

/** 저장된 문제집 하나를 이미지 서명 URL과 함께 불러온다. */
export async function loadWorkbook(id: string): Promise<LoadedWorkbook> {
  const { data: wb, error: wbError } = await supabase
    .from("workbooks")
    .select("id, title, unit_order")
    .eq("id", id)
    .maybeSingle();

  if (wbError) throw wbError;
  if (!wb) throw new Error("문제집을 찾을 수 없어요.");

  const { data: rows, error: probError } = await supabase
    .from("workbook_problems")
    .select("id, order_index, unit_name, source_title, page_number, image_path, answer, created_at")
    .eq("workbook_id", id)
    .order("order_index", { ascending: true });

  if (probError) throw probError;

  const problemRows = rows ?? [];
  const paths = problemRows
    .map((row) => row.image_path as string)
    .filter((path) => !!path);

  const urlMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL);
    (signed ?? []).forEach((entry) => {
      if (entry.path && entry.signedUrl) urlMap.set(entry.path, entry.signedUrl);
    });
  }

  const crops: ProblemCrop[] = problemRows.map((row) => {
    const path = (row.image_path as string) || "";
    return {
      id: row.id as string,
      imageDataUrl: urlMap.get(path) ?? "",
      imagePath: path || undefined,
      sourceTitle: (row.source_title as string) || "",
      pageNumber: (row.page_number as number) ?? 1,
      unitName: (row.unit_name as string) || "",
      answer: (row.answer as string) || "",
      createdAt: row.created_at ? new Date(row.created_at as string).getTime() : Date.now(),
    };
  });

  const unitOrder = Array.isArray(wb.unit_order) ? (wb.unit_order as string[]) : [];

  return { id: wb.id as string, title: (wb.title as string) || "", crops, unitOrder };
}

export interface SaveWorkbookInput {
  /** 기존 문제집이면 id, 새로 만들면 null */
  id: string | null;
  title: string;
  unitOrder: string[];
  crops: ProblemCrop[];
}

/** 문제집을 새로 만들거나 갱신한다. 잘라낸 이미지는 스토리지에 업로드한다. */
export async function saveWorkbook(input: SaveWorkbookInput): Promise<string> {
  const userId = await currentUserId();
  const { id, title, unitOrder, crops } = input;

  let workbookId = id;

  if (!workbookId) {
    const { data, error } = await supabase
      .from("workbooks")
      .insert({ user_id: userId, title, unit_order: unitOrder })
      .select("id")
      .single();
    if (error) throw error;
    workbookId = data.id as string;
  } else {
    const { error } = await supabase
      .from("workbooks")
      .update({ title, unit_order: unitOrder, updated_at: new Date().toISOString() })
      .eq("id", workbookId);
    if (error) throw error;
  }

  const finalId = workbookId as string;

  // 이미지를 업로드하고 경로를 확정한다.
  const prepared = await Promise.all(
    crops.map(async (crop, index) => {
      let imagePath = crop.imagePath ?? "";
      if (!imagePath && crop.imageDataUrl) {
        const blob = await dataUrlToBlob(crop.imageDataUrl);
        const ext = fileExtFromMime(blob.type || "image/png");
        const objectPath = `${userId}/${finalId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(objectPath, blob, { contentType: blob.type || "image/png", upsert: true });
        if (uploadError) throw uploadError;
        imagePath = objectPath;
      }
      return {
        user_id: userId,
        workbook_id: finalId,
        order_index: index,
        unit_name: crop.unitName,
        source_title: crop.sourceTitle,
        page_number: crop.pageNumber,
        image_path: imagePath,
        answer: crop.answer,
      };
    })
  );

  // 기존 문제를 모두 비우고 다시 넣는다(순서/삭제 반영을 단순하게 처리).
  const { error: deleteError } = await supabase
    .from("workbook_problems")
    .delete()
    .eq("workbook_id", finalId);
  if (deleteError) throw deleteError;

  if (prepared.length > 0) {
    const { error: insertError } = await supabase
      .from("workbook_problems")
      .insert(prepared);
    if (insertError) throw insertError;
  }

  return finalId;
}

/** 문제집과 그에 속한 문제/이미지를 삭제한다. */
export async function deleteWorkbook(id: string): Promise<void> {
  const userId = await currentUserId();

  const { data: files } = await supabase.storage.from(BUCKET).list(`${userId}/${id}`);
  if (files && files.length > 0) {
    const paths = files.map((file) => `${userId}/${id}/${file.name}`);
    await supabase.storage.from(BUCKET).remove(paths);
  }

  const { error } = await supabase.from("workbooks").delete().eq("id", id);
  if (error) throw error;
}