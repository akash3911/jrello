import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  PresenceViewer,
} from "./lib/realtime/events";
import { setSocketServer } from "./lib/realtime/server";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory room presence tracker
const roomViewers: Record<string, PresenceViewer[]> = {};

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || "", true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      path: "/api/socket",
      cors: { origin: true, credentials: true },
    }
  );

  // Expose to route handlers so mutations can broadcast in realtime.
  setSocketServer(io);

  io.on("connection", (socket) => {
    const joinedProjects = new Set<string>();
    let currentUser: PresenceViewer | null = null;

    const broadcastPresence = (projectId: string) => {
      io.to(`project:${projectId}`).emit("presence:update", {
        projectId,
        viewers: roomViewers[projectId] ?? [],
      });
    };

    const removeViewerFrom = (projectId: string) => {
      if (!currentUser || !roomViewers[projectId]) return;
      const before = roomViewers[projectId].length;
      roomViewers[projectId] = roomViewers[projectId].filter(
        (v) => v.id !== currentUser?.id
      );
      if (roomViewers[projectId].length !== before) {
        broadcastPresence(projectId);
      }
    };

    socket.on("project:join", ({ projectId, user }) => {
      currentUser = user;
      joinedProjects.add(projectId);
      socket.join(`project:${projectId}`);

      if (!roomViewers[projectId]) roomViewers[projectId] = [];
      if (!roomViewers[projectId].some((v) => v.id === user.id)) {
        roomViewers[projectId].push(user);
      }

      broadcastPresence(projectId);
    });

    socket.on("project:leave", ({ projectId }) => {
      joinedProjects.delete(projectId);
      socket.leave(`project:${projectId}`);
      removeViewerFrom(projectId);
    });

    socket.on("disconnect", () => {
      for (const projectId of joinedProjects) {
        removeViewerFrom(projectId);
      }
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Jrello ready on http://localhost:${port} (${dev ? "dev" : "production"})`);
    console.log(`> Realtime engine listening on path /api/socket`);
  });
});
