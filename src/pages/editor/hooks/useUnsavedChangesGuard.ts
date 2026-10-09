import { useEffect, useRef } from "react";

/**
 * 저장하지 않은 변경사항이 있을 때(dirty === true) 이탈을 막는다.
 * - 브라우저 새로고침 / 창 닫기: 브라우저 기본 경고를 띄운다.
 * - 앱 내부 링크(다른 페이지) 클릭: 이동을 가로채 onBlock 콜백으로 알린다.
 *   (BrowserRouter 환경이라 useBlocker 를 쓸 수 없어 클릭을 직접 감시한다.)
 */
export function useUnsavedChangesGuard(
  dirty: boolean,
  onBlock: (path: string) => void
) {
  const dirtyRef = useRef(dirty);
  const onBlockRef = useRef(onBlock);

  dirtyRef.current = dirty;
  onBlockRef.current = onBlock;

  // 브라우저 새로고침 / 창 닫기 경고
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // 앱 내부 링크 이동 가로채기
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!dirtyRef.current) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (/^(https?:|mailto:|tel:|#)/.test(href)) return;

      const current = window.location.pathname + window.location.search;
      if (href === current) return;

      event.preventDefault();
      event.stopPropagation();
      onBlockRef.current(toRouterPath(href));
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);
}

/** 브라우저 href(베이스 경로 포함)에서 라우터가 이해하는 경로만 남긴다. */
function toRouterPath(path: string): string {
  const base = (__BASE_PATH__ || "").replace(/\/+$/, "");
  if (base && (path === base || path.startsWith(`${base}/`))) {
    return path.slice(base.length) || "/";
  }
  return path;
}