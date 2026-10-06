"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setIsLoading(false);
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isQuestionPage = pathname.startsWith("/question");

  return (
    <header className="flex justify-between items-center p-4 border-b bg-white">
      <Link
        href="/"
        className="flex items-center gap-2 text-xl font-bold text-slate-900"
      >
        CodeStep
      </Link>

      <nav>
        <div className="flex items-center gap-4">
          {/* 画面遷移リンクはログイン状態に関係なく常に表示 */}
          {isQuestionPage ? (
            <Link
              href="/"
              className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
            >
              学習画面へ戻る
            </Link>
          ) : (
            <Link
              href="/question"
              className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
            >
              管理画面へ
            </Link>
          )}

          {/* ログイン状態だけLoading判定する */}
          {isLoading ? (
            <span className="text-gray-400 text-sm border-l pl-4">
              Loading...
            </span>
          ) : session ? (
            <div className="flex items-center gap-4 border-l pl-4">
              <span className="text-sm font-semibold text-slate-700">
                {session.user.email?.split("@")[0]} さん
              </span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-sm text-rose-500 hover:underline"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-bold text-blue-600 hover:underline border-l pl-4"
            >
              ログイン
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}