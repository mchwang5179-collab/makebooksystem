import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/feature/AppHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkbookList } from "@/pages/editor/hooks/useWorkbookList";

const steps = [
  {
    icon: "ri-upload-cloud-2-line",
    title: "시험지 업로드",
    desc: "기출시험지 PDF를 여러 개 올리고 파일마다 출처 제목을 적어요.",
  },
  {
    icon: "ri-drag-drop-line",
    title: "문제 드래그 선택",
    desc: "화면에 뜬 시험지 위에서 마우스로 문제를 드래그해 담아요.",
  },
  {
    icon: "ri-file-pdf-2-line",
    title: "문제집 PDF 저장",
    desc: "A4 4분할 양식에 번호를 붙여 문제집으로 내려받아요.",
  },
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workbooks, loading, error, deletingId, refresh, remove } =
    useWorkbookList();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <div className="min-h-screen w-full bg-background-50">
      <AppHeader />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8 md:py-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-primary-700">안녕하세요</p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-foreground-950 md:text-3xl">
              내 문제집
            </h2>
            <p className="mt-2 text-sm text-foreground-600">
              {user?.email} 계정으로 만든 문제집이 여기에 모여요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/editor")}
            className="flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary-500 px-5 py-3 text-sm font-medium text-background-50 transition-colors hover:bg-primary-600"
          >
            <i className="ri-add-line text-base" aria-hidden="true"></i>
            새 문제집 만들기
          </button>
        </div>

        <section className="mt-10">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[0, 1].map((key) => (
                <div
                  key={key}
                  className="h-40 animate-pulse rounded-lg border border-background-200 bg-background-100"
                ></div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-accent-200 bg-accent-50 p-6 text-center">
              <i
                className="ri-error-warning-line text-2xl text-accent-700"
                aria-hidden="true"
              ></i>
              <p className="mt-2 text-sm text-accent-900">{error}</p>
              <button
                type="button"
                onClick={refresh}
                className="mt-4 cursor-pointer whitespace-nowrap rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-background-50 transition-colors hover:bg-accent-700"
              >
                다시 시도
              </button>
            </div>
          ) : workbooks.length === 0 ? (
            <div className="rounded-lg border border-background-200 bg-background-100/70 p-6 md:p-10">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background-200 text-foreground-500">
                  <i className="ri-file-list-3-line text-2xl" aria-hidden="true"></i>
                </span>
                <h3 className="mt-5 font-heading text-lg font-bold text-foreground-950">
                  아직 만든 문제집이 없어요
                </h3>
                <p className="mt-2 max-w-md text-sm text-foreground-600">
                  기출시험지를 업로드하고 문제를 골라 첫 문제집을 만들어 보세요.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/editor")}
                  className="mt-6 flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border border-primary-300 bg-background-50 px-5 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
                >
                  <i className="ri-magic-line" aria-hidden="true"></i>
                  시작하기
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {workbooks.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-lg border border-background-200 bg-background-50 p-5 transition-colors hover:border-primary-300"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/editor/${item.id}`)}
                    className="flex cursor-pointer items-start gap-3 text-left"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                      <i className="ri-book-2-line text-xl" aria-hidden="true"></i>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-heading text-base font-bold text-foreground-950">
                        {item.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-500">
                        <span className="flex items-center gap-1">
                          <i className="ri-file-list-line" aria-hidden="true"></i>
                          {item.problemCount}문제
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="ri-calendar-line" aria-hidden="true"></i>
                          {formatDate(item.updatedAt)}
                        </span>
                      </span>
                    </span>
                  </button>

                  <div className="mt-4 flex items-center gap-2 border-t border-background-100 pt-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/editor/${item.id}`)}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-secondary-100 py-2 text-xs font-medium text-secondary-900 transition-colors hover:bg-secondary-200"
                    >
                      <i className="ri-edit-line text-sm" aria-hidden="true"></i>
                      열어서 편집
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmId((prev) => (prev === item.id ? null : item.id))
                      }
                      className="flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-background-300 px-3 py-2 text-xs font-medium text-foreground-600 transition-colors hover:bg-background-100 hover:text-accent-700"
                    >
                      <i className="ri-delete-bin-6-line text-sm" aria-hidden="true"></i>
                      삭제
                    </button>
                  </div>

                  {confirmId === item.id && (
                    <div className="mt-3 flex flex-col gap-2 rounded-md bg-accent-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs text-accent-900">
                        이 문제집을 삭제할까요? 되돌릴 수 없어요.
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="cursor-pointer whitespace-nowrap rounded-md bg-background-200 px-2.5 py-1 text-xs font-medium text-foreground-700 transition-colors hover:bg-background-300"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            remove(item.id);
                            setConfirmId(null);
                          }}
                          disabled={deletingId === item.id}
                          className="cursor-pointer whitespace-nowrap rounded-md bg-accent-600 px-2.5 py-1 text-xs font-medium text-background-50 transition-colors hover:bg-accent-700 disabled:opacity-50"
                        >
                          {deletingId === item.id ? "삭제 중…" : "삭제"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h3 className="font-heading text-lg font-bold text-foreground-950">
            이렇게 사용해요
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {steps.map((step, idx) => (
              <div
                key={step.title}
                className="rounded-lg border border-background-200 bg-background-50 p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-100 text-accent-700">
                    <i className={`${step.icon} text-xl`} aria-hidden="true"></i>
                  </span>
                  <span className="font-heading text-2xl font-bold text-background-300">
                    0{idx + 1}
                  </span>
                </div>
                <h4 className="mt-4 font-heading text-base font-bold text-foreground-950">
                  {step.title}
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground-600">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}