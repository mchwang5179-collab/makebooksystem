import { useCallback, useEffect, useState } from "react";
import {
  deleteWorkbook as deleteWorkbookApi,
  listWorkbooks,
  type WorkbookSummary,
} from "@/pages/editor/lib/workbookApi";

export function useWorkbookList() {
  const [workbooks, setWorkbooks] = useState<WorkbookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const list = await listWorkbooks();
      setWorkbooks(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "목록을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        await deleteWorkbookApi(id);
        setWorkbooks((prev) => prev.filter((item) => item.id !== id));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "삭제에 실패했어요.");
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  return { workbooks, loading, error, deletingId, refresh, remove };
}