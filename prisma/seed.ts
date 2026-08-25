/**
 * Seed a demo workspace + project + issues for local development.
 * Safe to re-run: skips seeding when the demo workspace already exists.
 *
 * Run: pnpm db:seed
 */
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, IssueStatusKind, IssuePriority } from "@prisma/client";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://jrello:jrellopassword@localhost:5432/jrello?schema=public";

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const DEMO_SLUG = "demo-eng";

async function main() {
  // 1. Ensure the local developer user exists
  const user = await prisma.user.upsert({
    where: { clerkId: "local_dev_user" },
    update: {},
    create: {
      clerkId: "local_dev_user",
      email: "dev@jrello.local",
      name: "Local Developer",
    },
  });

  // 2. Skip if already seeded
  const existing = await prisma.workspace.findUnique({ where: { slug: DEMO_SLUG } });
  if (existing) {
    console.log(`✓ Demo workspace "${DEMO_SLUG}" already exists — nothing to do.`);
    return;
  }

  // 3. Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "Demo Engineering",
      slug: DEMO_SLUG,
      description: "A seeded playground to explore Jrello.",
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  // 4. Project with canonical workflow
  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Core Platform",
      slug: "core-platform",
      key: "CORE",
      description: "Seeded demo project.",
      members: { create: { userId: user.id, role: "ADMIN" } },
    },
  });

  const statusDefs: {
    name: string;
    kind: IssueStatusKind;
    position: number;
    isDefault?: boolean;
  }[] = [
    { name: "Backlog", kind: IssueStatusKind.BACKLOG, position: 1000 },
    { name: "Todo", kind: IssueStatusKind.TODO, position: 2000, isDefault: true },
    { name: "In Progress", kind: IssueStatusKind.IN_PROGRESS, position: 3000 },
    { name: "In Review", kind: IssueStatusKind.IN_REVIEW, position: 4000 },
    { name: "Done", kind: IssueStatusKind.DONE, position: 5000 },
  ];

  const statuses: Record<string, { id: string }> = {};
  for (const s of statusDefs) {
    statuses[s.kind] = await prisma.issueStatus.create({
      data: { projectId: project.id, ...s, isDefault: s.isDefault ?? false },
    });
  }

  // Labels
  const labels = {
    feature: await prisma.issueLabel.create({
      data: { projectId: project.id, name: "feature", color: "blue" },
    }),
    bug: await prisma.issueLabel.create({
      data: { projectId: project.id, name: "bug", color: "red" },
    }),
    infra: await prisma.issueLabel.create({
      data: { projectId: project.id, name: "infra", color: "purple" },
    }),
  };

  // 5. Issues spread across columns
  const issues: {
    title: string;
    description: string;
    kind: IssueStatusKind;
    priority: IssuePriority;
    estimate: number;
    labelIds: string[];
  }[] = [
    {
      title: "Design kanban drag-and-drop interactions",
      description:
        "HTML5 DnD with optimistic updates and fractional sort orders. Keyboard parity for J/K/H/L.",
      kind: IssueStatusKind.DONE,
      priority: IssuePriority.HIGH,
      estimate: 5,
      labelIds: [labels.feature.id],
    },
    {
      title: "Set up PostgreSQL schema and migrations",
      description: "Prisma 7 with driver adapters against Postgres 15.",
      kind: IssueStatusKind.DONE,
      priority: IssuePriority.URGENT,
      estimate: 3,
      labelIds: [labels.infra.id],
    },
    {
      title: "Build realtime presence indicators",
      description: "Socket.IO room presence with reconnect-safe viewers list.",
      kind: IssueStatusKind.IN_PROGRESS,
      priority: IssuePriority.MEDIUM,
      estimate: 5,
      labelIds: [],
    },
    {
      title: "Sprint velocity reports",
      description: "Committed vs delivered points chart derived from completed sprints.",
      kind: IssueStatusKind.IN_REVIEW,
      priority: IssuePriority.MEDIUM,
      estimate: 3,
      labelIds: [labels.feature.id],
    },
    {
      title: "Fix flaky board reorder on rapid drops",
      description: "Midpoint sort order can converge when dropping fast in the same column.",
      kind: IssueStatusKind.TODO,
      priority: IssuePriority.HIGH,
      estimate: 2,
      labelIds: [labels.bug.id],
    },
    {
      title: "Add keyboard shortcut cheat-sheet polish",
      description: "Grouped by category, searchable via ⌘K.",
      kind: IssueStatusKind.TODO,
      priority: IssuePriority.LOW,
      estimate: 1,
      labelIds: [labels.feature.id],
    },
    {
      title: "GitHub webhook idempotency hardening",
      description: "Record delivery ids before processing to guarantee once-semantics.",
      kind: IssueStatusKind.BACKLOG,
      priority: IssuePriority.MEDIUM,
      estimate: 3,
      labelIds: [labels.infra.id],
    },
    {
      title: "Command palette issue search debounce tuning",
      description: "250ms debounce across all projects in the workspace.",
      kind: IssueStatusKind.BACKLOG,
      priority: IssuePriority.NONE,
      estimate: 2,
      labelIds: [],
    },
  ];

  let number = 101;
  for (const def of issues) {
    const columnIssues = await prisma.issue.findMany({
      where: { projectId: project.id, statusId: statuses[def.kind].id },
      select: { sortOrder: true },
      orderBy: { sortOrder: "desc" },
      take: 1,
    });
    const sortOrder = (columnIssues[0]?.sortOrder ?? 0) + 1000;

    await prisma.issue.create({
      data: {
        projectId: project.id,
        number: number++,
        title: def.title,
        description: def.description,
        statusId: statuses[def.kind].id,
        priority: def.priority,
        sortOrder,
        estimate: def.estimate,
        assigneeId: user.id,
        createdById: user.id,
        labels: { create: def.labelIds.map((labelId) => ({ labelId })) },
      },
    });
  }

  console.log(`
✓ Seed complete!

  Workspace : /${DEMO_SLUG}  (Demo Engineering)
  Project   : Core Platform (${project.key})
  Issues    : ${issues.length} seeded across ${statusDefs.length} columns

Sign in as your usual user or run in local mode — the dev user is auto-provisioned.
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
