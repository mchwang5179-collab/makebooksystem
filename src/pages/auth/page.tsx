import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "login" | "signup";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError("로그인에 실패했어요. 이메일과 비밀번호를 확인해 주세요.");
          return;
        }
        navigate("/", { replace: true });
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) {
          setError(signUpError.message || "회원가입에 실패했어요.");
          return;
        }
        if (data.session) {
          navigate("/", { replace: true });
        } else {
          setNotice(
            "가입이 완료되었어요! 이메일 인증이 필요하다면 받은편지함을 확인해 주세요."
          );
        }
      }
    } catch {
      setError("문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  return (
    <div className="flex min-h-screen w-full bg-background-50">
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-primary-500 p-12 lg:flex">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://readdy.ai/api/search-image?query=Abstract%20minimal%20grid%20of%20geometric%20math%20shapes%20and%20graph%20curves%20on%20a%20deep%20muted%20green%20background%2C%20editorial%2C%20calm%20scholarly%20aesthetic%2C%20high%20detail&width=1000&height=1300&seq=mathworkbook-side-01&orientation=portrait"
            alt="수학 문제집 배경"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-background-50">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-50/20">
              <i className="ri-book-2-line text-xl" aria-hidden="true"></i>
            </span>
            <span className="font-heading text-xl font-bold">문제집 생성기</span>
          </div>
        </div>
        <div className="relative z-10 text-background-50">
          <h1 className="font-heading text-3xl font-bold leading-snug">
            기출시험지에서
            <br />
            필요한 문제만 골라
            <br />
            나만의 문제집을 만드세요
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-background-100">
            여러 시험지를 한 번에 업로드하고, 드래그로 문제를 선택해 단원별로 정리한 뒤
            A4 4분할 문제집으로 저장할 수 있어요.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-6 text-background-100">
          <div className="flex items-center gap-2 text-sm">
            <i className="ri-drag-drop-line" aria-hidden="true"></i>
            드래그로 문제 선택
          </div>
          <div className="flex items-center gap-2 text-sm">
            <i className="ri-file-pdf-2-line" aria-hidden="true"></i>
            PDF로 저장
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12 md:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-background-50">
              <i className="ri-book-2-line text-lg" aria-hidden="true"></i>
            </span>
            <span className="font-heading text-lg font-bold text-foreground-950">
              문제집 생성기
            </span>
          </div>

          <h2 className="font-heading text-2xl font-bold text-foreground-950">
            {mode === "login" ? "다시 오셨네요" : "시작해 볼까요?"}
          </h2>
          <p className="mt-2 text-sm text-foreground-600">
            {mode === "login"
              ? "로그인하고 내 문제집을 이어서 만들어 보세요."
              : "계정을 만들면 만든 문제집을 안전하게 보관할 수 있어요."}
          </p>

          <div className="mt-6 inline-flex rounded-full border border-background-200 bg-background-100 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
                mode === "login"
                  ? "bg-primary-500 text-background-50"
                  : "text-foreground-600 hover:text-foreground-950"
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
                mode === "signup"
                  ? "bg-primary-500 text-background-50"
                  : "text-foreground-600 hover:text-foreground-950"
              }`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-foreground-800"
              >
                이메일
              </label>
              <div className="flex items-center gap-2 rounded-md border border-background-300 bg-background-50 px-3 focus-within:border-primary-400">
                <i className="ri-mail-line text-base text-foreground-400" aria-hidden="true"></i>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent py-3 text-sm text-foreground-950 outline-none placeholder:text-foreground-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-foreground-800"
              >
                비밀번호
              </label>
              <div className="flex items-center gap-2 rounded-md border border-background-300 bg-background-50 px-3 focus-within:border-primary-400">
                <i className="ri-lock-line text-base text-foreground-400" aria-hidden="true"></i>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6자 이상"
                  className="w-full bg-transparent py-3 text-sm text-foreground-950 outline-none placeholder:text-foreground-400"
                />
              </div>
            </div>

            {error && (
              <p className="flex items-start gap-2 rounded-md bg-accent-100 px-3 py-2 text-sm text-accent-900">
                <i className="ri-error-warning-line mt-0.5" aria-hidden="true"></i>
                <span>{error}</span>
              </p>
            )}
            {notice && (
              <p className="flex items-start gap-2 rounded-md bg-primary-100 px-3 py-2 text-sm text-primary-900">
                <i className="ri-checkbox-circle-line mt-0.5" aria-hidden="true"></i>
                <span>{notice}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary-500 px-4 py-3 text-sm font-medium text-background-50 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <i className="ri-loader-4-line animate-spin" aria-hidden="true"></i>
              ) : (
                <i
                  className={mode === "login" ? "ri-login-box-line" : "ri-user-add-line"}
                  aria-hidden="true"
                ></i>
              )}
              {mode === "login" ? "로그인" : "회원가입"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-foreground-500">
            계속 진행하면 서비스 이용에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}