import { getSession, type SessionPayload } from "@/lib/auth";

/**
 * Re-checks the session inside a Server Action or route handler. These are
 * reachable directly via POST/GET, so route protection alone is not enough.
 */
export async function requireOwner(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}
