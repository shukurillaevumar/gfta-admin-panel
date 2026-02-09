// app/admin/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const c = await cookies();

  // имена как в твоем API: COOKIE_ACCESS_NAME по умолчанию user_token
  const access = c.get("user_token")?.value;

  if (!access) redirect("/login?next=/admin");

  return (
    <div className="min-h-screen bg-[#F5F6F7] text-[#2B2E33]">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-2xl font-extrabold">GFTA Admin</div>
              <div className="text-lg text-[#7B7F85]">
                Users approvals and access control
              </div>
            </div>
          </div>

          <nav className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-2xl border border-white/55 bg-white/45 px-5 py-2.5 text-base font-semibold shadow-[0_12px_35px_rgba(43,46,51,0.10)] backdrop-blur-xl transition hover:bg-white/60"
            >
              Заявки
            </Link>
            <Link
              href="/admin/users"
              className="rounded-2xl border border-white/55 bg-white/45 px-5 py-2.5 text-base font-semibold shadow-[0_12px_35px_rgba(43,46,51,0.10)] backdrop-blur-xl transition hover:bg-white/60"
            >
              Пользователи
            </Link>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="rounded-2xl border border-[#C1C4C8]/60 bg-white/55 px-5 py-2.5 text-base font-semibold text-[#2B2E33] transition hover:bg-white/70"
              >
                Выйти
              </button>
            </form>
          </nav>
        </header>

        {children}
      </div>
    </div>
  );
}
