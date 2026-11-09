export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
  };
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body.code ?? "error",
      body.error ?? "Anfrage fehlgeschlagen",
    );
  }
  return body as T;
}
