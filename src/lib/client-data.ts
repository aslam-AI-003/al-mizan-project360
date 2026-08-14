import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Resolves the signed-in client's session and "their" project.
 *
 * Authorization note: the project is always looked up by `clientId: session.userId`
 * — never by an id coming from a route param or query string — so a client can
 * never view another client's project by guessing/crafting an id. If a client ever
 * has more than one project, this picks the earliest non-archived one; the demo
 * seed data gives each client exactly one project.
 */
export async function getClientContext() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: { clientId: session.userId, archived: false },
    orderBy: { createdAt: "asc" },
  });

  return { session, project };
}

export type ClientProject = Awaited<ReturnType<typeof getClientContext>>["project"];
