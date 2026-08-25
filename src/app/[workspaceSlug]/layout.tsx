import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { getCurrentUser } from "@/lib/api/auth";
import {
  getWorkspaceBySlug,
  getUserWorkspaces,
} from "@/lib/api/workspaces";
import type { ShellContext } from "@/lib/types";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const actor = await getCurrentUser();
  if (!actor) notFound();

  const workspace = await getWorkspaceBySlug(workspaceSlug, actor.user.id);
  if (!workspace) notFound();

  const allWorkspaces = await getUserWorkspaces(actor.user.id);

  const context: ShellContext = {
    currentUser: {
      id: actor.user.id,
      name: actor.user.name,
      email: actor.user.email,
      avatarUrl: actor.user.avatarUrl,
    },
    workspaces: allWorkspaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      role: w.role as ShellContext["workspaces"][number]["role"],
    })),
    currentWorkspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role:
        (workspace.members.find((m) => m.userId === actor.user.id)?.role as
          | "OWNER"
          | "ADMIN"
          | "MEMBER") ?? "MEMBER",
    },
    projects: workspace.projects.map((p) => ({
      id: p.id,
      name: p.name,
      key: p.key,
      slug: p.slug,
      description: p.description,
      issueCount: p._count.issues,
    })),
  };

  return <AppShell context={context}>{children}</AppShell>;
}
