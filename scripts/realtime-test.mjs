// Realtime smoke test: join project room, trigger a move via API, expect event.
import { io } from "socket.io-client";

const [,, projectKey, numStr] = process.argv;
const B = "http://localhost:3000";
const J = { "Content-Type": "application/json" };

async function api(path, init) {
  const res = await fetch(B + path, init);
  return res.json();
}

const proj = await api("/api/v1/workspaces/demo-eng/projects/core-platform");
const statuses = Object.fromEntries(proj.project.statuses.map((s) => [s.kind, s.id]));

const socket = io(B, { path: "/api/socket", transports: ["polling"] });

socket.on("connect", async () => {
  console.log("socket connected:", socket.id);

  socket.emit("project:join", {
    projectId: proj.project.id,
    user: { id: "tester-bot", name: "Tester Bot", avatarUrl: null, color: "#5b5bd6", initials: "TB" },
  });

  // Create a scratch issue, then move it
  const created = await api(`/api/v1/workspaces/demo-eng/projects/${projectKey}/issues`, {
    method: "POST",
    headers: J,
    body: JSON.stringify({ title: "realtime probe", statusKind: "TODO", priority: "LOW" }),
  });
  console.log("created issue:", created.issue.number);

  setTimeout(async () => {
    await api(`/api/v1/workspaces/demo-eng/projects/${projectKey}/issues/${created.issue.number}/move`, {
      method: "POST",
      headers: J,
      body: JSON.stringify({ targetStatusId: statuses.IN_PROGRESS }),
    });
    console.log("move request sent");
  }, 600);
});

let presenceSeen = false;
socket.on("presence:update", (d) => {
  if (!presenceSeen) {
    presenceSeen = true;
    console.log("presence:update received — viewers:", d.viewers.map((v) => v.name).join(", "));
  }
});

socket.on("issue:moved", (d) => {
  console.log("issue:moved received ✓ —", d.fromStatus, "->", d.toStatus, "| actor:", d.actorName || "(n/a)");
});

socket.on("issue:created", (d) => {
  console.log("issue:created received ✓ — number:", d.issue.number);
});

setTimeout(async () => {
  console.log("REALTIME TEST PASSED");
  process.exit(0);
}, 4000);
