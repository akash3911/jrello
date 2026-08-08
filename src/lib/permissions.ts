import { WorkspaceRole, ProjectRole } from "@prisma/client";

export function canManageWorkspace(role?: WorkspaceRole | null): boolean {
  return role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN;
}

export function canManageProject(
  workspaceRole?: WorkspaceRole | null,
  projectRole?: ProjectRole | null
): boolean {
  if (workspaceRole === WorkspaceRole.OWNER || workspaceRole === WorkspaceRole.ADMIN) {
    return true;
  }
  return projectRole === ProjectRole.ADMIN;
}

export function canCreateIssue(projectRole?: ProjectRole | null): boolean {
  return (
    projectRole === ProjectRole.ADMIN ||
    projectRole === ProjectRole.MEMBER
  );
}

export function canEditIssue(projectRole?: ProjectRole | null): boolean {
  return (
    projectRole === ProjectRole.ADMIN ||
    projectRole === ProjectRole.MEMBER
  );
}

export function canDeleteIssue(
  workspaceRole?: WorkspaceRole | null,
  projectRole?: ProjectRole | null
): boolean {
  if (workspaceRole === WorkspaceRole.OWNER || workspaceRole === WorkspaceRole.ADMIN) {
    return true;
  }
  return projectRole === ProjectRole.ADMIN;
}
