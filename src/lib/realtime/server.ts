import type { Server as SocketIOServer } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/lib/realtime/events";

/**
 * The Socket.IO server lives in src/server.ts (custom Next server).
 * It publishes itself on globalThis so route handlers running inside the
 * same process can broadcast events. When Next runs without the custom
 * server (e.g. `next dev`), every emit below degrades to a no-op.
 */

const globalForIo = globalThis as unknown as {
  __jrello_io?: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
};

export function setSocketServer(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
) {
  globalForIo.__jrello_io = io;
}

export function getSocketServer():
  | SocketIOServer<ClientToServerEvents, ServerToClientEvents>
  | undefined {
  return globalForIo.__jrello_io;
}

type ProjectRoomEvent = Parameters<
  SocketIOServer<ClientToServerEvents, ServerToClientEvents>["emit"]
>[0];

/** Broadcast an event to every socket joined to `project:{projectId}`. */
export function emitToProject<T extends ProjectRoomEvent>(
  projectId: string,
  event: T,
  ...args: unknown[]
) {
  const io = getSocketServer();
  if (!io) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (io.to(`project:${projectId}`) as any).emit(event, ...args);
  } catch {
    // Never let a broadcast failure break the mutation that triggered it.
  }
}
