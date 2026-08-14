import { redirect } from "next/navigation";
import { Image as ImageIcon } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOwnedProjectOrRedirect } from "@/lib/supervisor-guard";
import { EmptyState } from "@/components/empty-state";
import { uploadPhoto } from "./actions";

const PRESET_PHOTOS = [
  { value: "https://picsum.photos/seed/site-foundation/900/700", label: "Foundation / Structural" },
  { value: "https://picsum.photos/seed/site-brickwork/900/700", label: "Brickwork" },
  { value: "https://picsum.photos/seed/site-electrical/900/700", label: "Electrical / Plumbing" },
  { value: "https://picsum.photos/seed/site-finishing/900/700", label: "Finishing / Painting" },
  { value: "https://picsum.photos/seed/site-general/900/700", label: "General Site View" },
];

const WORK_CATEGORIES = [
  "Structural Work",
  "Brickwork",
  "Electrical Work",
  "Plumbing Work",
  "Plastering",
  "Flooring",
  "Painting",
  "Finishing Work",
  "Site Preparation",
];

export default async function PhotosPage({ params }: PageProps<"/supervisor/projects/[id]/photos">) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "SUPERVISOR") redirect("/login");
  const project = await getOwnedProjectOrRedirect(id, session.userId);

  const photos = await prisma.projectPhoto.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Upload Photos</h2>
        <p className="text-sm text-black/50">{project.name}</p>
      </div>

      <form action={uploadPhoto} className="card space-y-3 p-4">
        <input type="hidden" name="projectId" value={id} />

        <div>
          <label className="label">Choose a Photo</label>
          <select name="presetUrl" className="select" defaultValue={PRESET_PHOTOS[0].value}>
            {PRESET_PHOTOS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Or Paste a Photo URL (optional)</label>
          <input type="url" name="customUrl" className="input" placeholder="https://..." />
        </div>

        <div>
          <label className="label">Work Category</label>
          <select name="workCategory" required className="select" defaultValue={WORK_CATEGORIES[0]}>
            {WORK_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Caption</label>
          <input type="text" name="caption" required className="input" placeholder="e.g. Ground floor slab work" />
        </div>

        <button type="submit" className="btn-primary w-full">Upload Photo</button>
      </form>

      <div>
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Project Gallery</h3>
        {photos.length === 0 ? (
          <EmptyState icon={ImageIcon} title="No photos yet" description="Upload the first site photo above." />
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.caption}
                title={photo.caption}
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
