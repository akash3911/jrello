import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  PresenceViewer,
} from "./lib/realtime/events";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
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

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    path: "/api/socket",
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    let activeProjectId: string | null = null;
    let currentUser: PresenceViewer | null = null;

    socket.on("project:join", ({ projectId, user }) => {
      activeProjectId = projectId;
      currentUser = user;
      socket.join(`project:${projectId}`);

      if (!roomViewers[projectId]) {
        roomViewers[projectId] = [];
      }

      // Add user to presence list if not already present
      if (!roomViewers[projectId].some((v) => v.id === user.id)) {
        roomViewers[projectId].push(user);
      }

      io.to(`project:${projectId}`).emit("presence:update", {
        projectId,
        viewers: roomViewers[projectId],
      });
    });

    socket.on("project:leave", ({ projectId, userId }) => {
      socket.leave(`project:${projectId}`);
      if (roomViewers[projectId]) {
        roomViewers[projectId] = roomViewers[projectId].filter((v) => v.id !== userId);
        io.to(`project:${projectId}`).emit("presence:update", {
          projectId,
          viewers: roomViewers[projectId],
        });
      }
    });

    socket.on("disconnect", () => {
      if (activeProjectId && currentUser && roomViewers[activeProjectId]) {
        roomViewers[activeProjectId] = roomViewers[activeProjectId].filter(
          (v) => v.id !== currentUser?.id
        );
        io.to(`project:${activeProjectId}`).emit("presence:update", {
          projectId: activeProjectId,
          viewers: roomViewers[activeProjectId],
        });
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Jrello server ready on http://${hostname}:${port}`);
  });
});
