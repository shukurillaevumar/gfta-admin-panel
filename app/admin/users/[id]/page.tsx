"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";

type UserItem = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "PENDING" | "BLOCKED";
  createdAt: string;
  ip: string;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: UserItem["status"]) {
  if (status === "ACTIVE") return "Активен";
  if (status === "BLOCKED") return "Заблокирован";
  return "Ожидает";
}

function statusBadge(status: UserItem["status"]) {
  if (status === "ACTIVE") return "badge badge-success";
  if (status === "BLOCKED") return "badge badge-danger";
  return "badge badge-warning";
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function UserDetailsPage() {
  const params = useParams<{ id: string }>();
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const data = await apiGet<{ items: UserItem[] }>("/api/admin/users");
        setItems(data.items ?? []);
      } catch (e: unknown) {
        setErr(getErrorMessage(e, "Не удалось загрузить пользователя"));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const user = useMemo(
    () => items.find((x) => x.id === params.id),
    [items, params.id],
  );

  return (
    <section className="space-y-5">
      <div className="toolbar p-5">
        <Link href="/admin/users" className="btn btn-secondary mb-5">
          Назад к пользователям
        </Link>

        {loading && (
          <div className="grid gap-3">
            <div className="h-9 w-72 animate-pulse rounded-xl bg-[#eef1f5]" />
            <div className="h-5 w-96 max-w-full animate-pulse rounded-xl bg-[#eef1f5]" />
          </div>
        )}

        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {err}
          </div>
        )}

        {!loading && !err && !user && (
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Пользователь не найден
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#68707d]">
              Возможно, запись была удалена или у вас нет доступа к данным.
            </p>
          </div>
        )}

        {user && (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#68707d]">
                User profile
              </p>
              <h1 className="mt-1 truncate text-3xl font-black tracking-tight">
                {user.email}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#68707d]">
                Карточка пользователя для быстрой проверки статуса и базовых
                атрибутов доступа.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={statusBadge(user.status)}>
                {statusLabel(user.status)}
              </span>
              <span className="badge badge-neutral">
                {user.role === "ADMIN" ? "Админ" : "Пользователь"}
              </span>
            </div>
          </div>
        )}
      </div>

      {user && (
        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <div className="panel p-5">
            <h2 className="text-lg font-black">Основная информация</h2>
            <div className="mt-5 grid gap-4">
              <Detail label="Email" value={user.email} />
              <Detail label="ID" value={user.id} mono />
              <Detail label="IP" value={user.ip || "unknown"} />
              <Detail label="Создан" value={fmt(user.createdAt)} />
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="text-lg font-black">Доступ</h2>
            <div className="mt-5 grid gap-4">
              <Detail label="Статус" value={statusLabel(user.status)} />
              <Detail
                label="Роль"
                value={user.role === "ADMIN" ? "Администратор" : "Пользователь"}
              />
              <div className="rounded-xl border border-[#dde1e7] bg-[#fafbfc] p-4 text-sm leading-6 text-[#68707d]">
                Изменение роли и доступа выполняется на странице списка
                пользователей. Так меньше риск случайно применить действие в
                карточке просмотра.
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 border-b border-[#edf0f4] pb-4 last:border-0 last:pb-0">
      <div className="text-xs font-bold uppercase tracking-[0.08em] text-[#68707d]">
        {label}
      </div>
      <div
        className={`break-words text-sm font-black ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
