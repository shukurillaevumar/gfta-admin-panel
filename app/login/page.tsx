"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type LoginState = "idle" | "loading" | "error";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();

  const next = useMemo(() => params.get("next") || "/admin", [params]);

  const [state, setState] = useState<LoginState>("idle");
  const [email, setEmail] = useState("admin@gfta.local");
  const [password, setPassword] = useState("12345678");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    email.trim().length > 3 && password.length >= 6 && state !== "loading";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("loading");

    // TODO: подключим реальный API
    // POST /auth/login -> { accessToken } + сохранить в cookie/localStorage (решим позже)
    await new Promise((r) => setTimeout(r, 650));

    // Мок "успешного входа"
    const ok = email.includes("@") && password.length >= 6;

    if (!ok) {
      setState("error");
      setError("Неверный email или пароль. Люди продолжают путать это годами.");
      return;
    }

    setState("idle");
    router.push(next);
  }

  return (
    <main className="min-h-screen bg-[#F5F6F7] text-[#2B2E33]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center px-4 py-10 md:px-8">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          {/* Left */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/35 px-4 py-2 shadow-[0_18px_50px_rgba(43,46,51,0.10)] backdrop-blur-xl">
              <span className="h-3 w-3 rounded-full bg-[#2B2E33]" />
              <span className="text-base font-semibold tracking-tight">
                GFTA Admin Panel
              </span>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Вход в админку
            </h1>

            <div className="rounded-3xl border border-white/50 bg-white/35 p-6 shadow-[0_18px_60px_rgba(43,46,51,0.12)] backdrop-blur-xl">
              <div className="flex flex-col gap-2 text-base">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold">Статус:</span>
                  <span
                    className={`rounded-xl px-3 py-1.5 font-semibold ${
                      state === "loading"
                        ? "bg-black/5 text-[#2B2E33]"
                        : "bg-emerald-500/10 text-emerald-700"
                    }`}
                  >
                    {state === "loading" ? "Проверяем..." : "Готово к работе"}
                  </span>
                </div>
                <div className="h-px w-full bg-black/5" />
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="rounded-[28px] border border-white/55 bg-white/40 p-6 shadow-[0_20px_80px_rgba(43,46,51,0.14)] backdrop-blur-2xl md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold">Авторизация</h2>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-base font-semibold">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gfta.com"
                  className="h-12 w-full rounded-2xl border border-[#C1C4C8]/60 bg-white/55 px-4 text-lg outline-none ring-0 transition focus:border-[#2B2E33]/50 focus:bg-white/70"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-base font-semibold">Пароль</label>
                <div className="flex items-center gap-3">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-12 w-full rounded-2xl border border-[#C1C4C8]/60 bg-white/55 px-4 text-lg outline-none transition focus:border-[#2B2E33]/50 focus:bg-white/70"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="h-12 shrink-0 rounded-2xl border border-[#C1C4C8]/60 bg-white/55 px-4 text-base font-semibold text-[#2B2E33] transition hover:bg-white/70 active:scale-[0.99]"
                  >
                    {showPass ? "Скрыть" : "Показать"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-base font-semibold text-red-700">
                  {error}
                </div>
              )}

              <button
                disabled={!canSubmit}
                className="h-12 w-full rounded-2xl bg-[#2B2E33] text-lg font-extrabold text-white shadow-[0_18px_40px_rgba(43,46,51,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state === "loading" ? "Входим..." : "Войти"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
