import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function jsonOk<T>(data: T, message = "ok") {
  return Response.json({ success: true, data, message });
}

export function jsonError(message: string, status = 400, error?: unknown) {
  return Response.json(
    {
      success: false,
      data: null,
      message,
      error: error instanceof Error ? error.message : error ?? null,
    },
    { status },
  );
}

export function normalizeBizNo(value?: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length ? digits : null;
}
