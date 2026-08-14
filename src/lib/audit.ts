import { prisma } from "@/lib/db";

export async function logAudit(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
}) {
  await prisma.auditLog.create({ data: params });
}

export async function notify(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    },
  });
}
