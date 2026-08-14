"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

export async function createSupplier(formData: FormData) {
  const session = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const shopName = String(formData.get("shopName") ?? "").trim();
  const contactPerson = String(formData.get("contactPerson") ?? "").trim();
  const mobile = String(formData.get("mobile") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const materialsSupplied = String(formData.get("materialsSupplied") ?? "").trim();

  if (!name || !shopName || !contactPerson || !mobile || !address || !materialsSupplied) {
    throw new Error("Missing required fields");
  }

  const supplier = await prisma.supplier.create({
    data: { name, shopName, contactPerson, mobile, address, materialsSupplied },
  });

  await logAudit({
    userId: session.userId,
    action: "CREATE",
    entityType: "Supplier",
    entityId: supplier.id,
    description: `Admin ${session.name} added supplier "${supplier.name}"`,
  });

  revalidatePath("/admin/suppliers");
}
