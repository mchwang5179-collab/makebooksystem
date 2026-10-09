import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-background-200 bg-background-50/90 backdrop-blur">
      <div className="flex h-16 w-full items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-background-50">
              <i className="ri-book-2-line text-lg" aria-hidden="true"></i>
            </span>
            <span className="font-heading text-lg font-bold text-foreground-950">
              문제집 생성기
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              to="/"
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-foreground-700 transition-colors hover:bg-background-100 hover:text-foreground-950"
            >
              내 문제집
            </Link>
            <Link
              to="/editor"
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-foreground-700 transition-colors hover:bg-background-100 hover:text-foreground-950"
            >
              새 문제집 만들기
            </Link>
          </nav>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-background-200 bg-background-50 px-3 py-2 text-sm text-foreground-700 transition-colors hover:bg-background-100"
          >
            <i className="ri-user-3-line text-base" aria-hidden="true"></i>
            <span className="hidden max-w-[160px] truncate sm:block">
              {user?.email ?? "사용자"}
            </span>
            <i className="ri-arrow-down-s-line" aria-hidden="true"></i>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-background-200 bg-background-50 py-1 shadow-sm">
              <div className="border-b border-background-100 px-4 py-2">
                <p className="truncate text-xs text-foreground-500">
                  {user?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-foreground-700 transition-colors hover:bg-background-100"
              >
                <i className="ri-logout-box-r-line" aria-hidden="true"></i>
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}