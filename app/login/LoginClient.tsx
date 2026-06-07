"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/api";

type LoginState = "idle" | "loading" | "error";

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();

  const next = useMemo(() => params.get("next") || "/admin", [params]);

  const [state, setState] = useState<LoginState>("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    email.trim().length > 3 && password.length >= 8 && state !== "loading";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("loading");

    try {
      await apiPost<{ user: { id: string; email: string } }>(
        "/api/auth/login",
        {
          email,
          password,
        },
      );

      setState("idle");
      router.push(next);
    } catch (err: unknown) {
      setState("error");
      setError(getErrorMessage(err, "Не удалось войти"));
    }
  }

  return (
    <main className="app-shell min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center px-4 py-10 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-7">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#17191d] text-sm font-black text-white">
                G
              </div>
              <div>
                <div className="text-xl font-black tracking-tight">
                  GFTA Admin
                </div>
                <div className="text-sm font-semibold text-[#68707d]">
                  Secure operations console
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
              Вход в панель управления
            </h1>

            <p className="max-w-md text-base leading-7 text-[#68707d]">
              Авторизуйтесь, чтобы просматривать заявки, управлять доступом и
              менять роли пользователей.
            </p>

            <div className="panel grid gap-4 p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-[#68707d]">
                  Состояние
                </span>
                <span
                  className={`badge ${
                    state === "loading" ? "badge-warning" : "badge-success"
                  }`}
                >
                  {state === "loading" ? "Проверяем" : "Готово"}
                </span>
              </div>
              <div className="h-px bg-[#edf0f4]" />
              <div className="text-sm leading-6 text-[#68707d]">
                Доступ разрешен только администраторам. После входа вы
                автоматически вернетесь на запрошенную страницу.
              </div>
            </div>
          </div>

          <div className="surface rounded-[24px] p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-black">Авторизация</h2>
              <p className="mt-1 text-sm font-medium text-[#68707d]">
                Введите рабочую почту и пароль.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#343941]">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gftacomp@gmail.com"
                  className="field"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#343941]">
                  Пароль
                </label>
                <div className="flex items-center gap-3">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className="field"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="btn btn-secondary shrink-0"
                  >
                    {showPass ? "Скрыть" : "Показать"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <button disabled={!canSubmit} className="btn btn-primary w-full">
                {state === "loading" ? "Входим..." : "Войти"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
