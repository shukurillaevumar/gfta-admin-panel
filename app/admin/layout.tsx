import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminNav from "./AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const c = await cookies();
  const access = c.get("user_token")?.value;

  if (!access) redirect("/login?next=/admin");

  return (
    <div className="app-shell min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-8">
        <header className="sticky top-0 z-20 -mx-4 mb-6 border-b border-[#dde1e7]/80 bg-[#f7f8fa]/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#17191d] text-sm font-black text-white">
                G
              </div>
              <div className="min-w-0">
                <div className="truncate text-lg font-black tracking-tight">
                  GFTA Admin
                </div>
                <div className="truncate text-sm font-semibold text-[#68707d]">
                  Заявки, роли и доступ пользователей
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <AdminNav />
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="btn btn-secondary w-full sm:w-auto">
                  Выйти
                </button>
              </form>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
