import { z } from "zod";

const apiErrorSchema = z.object({ message: z.string().min(1) }).loose();

/** Extract a safe, user-facing message from any API failure response. */
export async function getApiErrorMessage(
  response: Response,
  fallback = "Request gagal diproses. Coba lagi.",
) {
  const payload: unknown = await response.json().catch(() => undefined);
  const parsed = apiErrorSchema.safeParse(payload);
  return parsed.success ? parsed.data.message : fallback;
}
