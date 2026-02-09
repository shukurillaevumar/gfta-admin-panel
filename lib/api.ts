// lib/api.ts
export type ApiError = {
  error?: string;
  message?: string;
  details?: any;
};

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as ApiError;
    return data?.error || data?.message || "Request failed";
  } catch {
    return "Request failed";
  }
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as T;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as T;
}
