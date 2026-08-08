import { notFound, redirect } from "next/navigation";
import { getWorkspaceBySlug } from "@/lib/api/workspaces";
import { getCurrentUser } from "@/lib/api/auth";

interface WorkspacePageProps {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceSlug } = await params;
  const actor = await getCurrentUser();

  const workspace = await getWorkspaceBySlug(workspaceSlug, actor?.user.id);

  if (!workspace) {
    notFound();
  }

  // Redirect to first active project if one exists
  const firstProject = workspace.projects[0];
  if (firstProject) {
    redirect(`/${workspace.slug}/projects/${firstProject.slug}`);
  }

  // Otherwise render empty workspace view
  redirect("/onboarding");
}
