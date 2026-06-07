import Link from "next/link";

export default function HomePage() {
  return (
    <main className="app-shell flex min-h-screen items-center justify-center p-6">
      <div className="surface w-full max-w-2xl rounded-[24px] p-8 md:p-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#17191d] text-sm font-black text-white">
              G
            </div>
            <div>
              <div className="text-lg font-black">GFTA Admin</div>
              <div className="text-sm font-medium text-[#68707d]">
                Панель контроля доступа
              </div>
            </div>
          </div>
          <span className="badge badge-success">Online</span>
        </div>

        <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
          Управление заявками и пользователями
        </h1>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/login" className="btn btn-primary min-w-36">
            Войти
          </Link>
          <Link href="/admin" className="btn btn-secondary min-w-36">
            Открыть админку
          </Link>
        </div>
      </div>
    </main>
  );
}
