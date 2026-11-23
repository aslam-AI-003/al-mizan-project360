import { redirect } from "next/navigation";

/** The project list lives on the Home page now. */
export default function ProjectsPage() {
  redirect("/admin");
}
