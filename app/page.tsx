// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0b1622] text-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-extrabold">Anti-scam</h1>
        <p className="mt-3 text-white/70">
          Secure access portal. Please sign in to continue.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-white text-black px-4 py-2 font-semibold"
          >
            Sign in
          </Link>
          <Link
            href="/admin"
            className="rounded-xl border border-white/15 px-4 py-2 font-semibold text-white/90"
          >
            Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
