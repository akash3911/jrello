# Jrello — Real-time (Socket.IO)

Real-time keeps every viewer of a project in sync without manual refresh. It is
**advisory**: the database is always the source of truth, and clients refetch on
reconnect. Real-time is for low-latency awareness, not for correctness.

This document is the **event contract**. Every event is typed end-to-end in
`src/lib/realtime/events.ts`; the client never handles an untyped event.

---

## Connection lifecycle

1. Client opens a Socket.IO connection after the app shell mounts, carrying the session
   cookie.
2. Server middleware authenticates the socket from the cookie → resolves `userId`.
3. Client emits `project:join` with `{ projectId }` when entering a project view.
4. Server verifies membership, joins socket room `project:<projectId>`, tracks presence,
   broadcasts `presence:update`.
5. On leaving the view, client emits `project:leave` (also on disconnect).

## Rooms

- `project:<projectId>` — everyone viewing a given project. Scopes issue/board events.
- `user:<userId>` — a user's personal channel (notifications).
- `workspace:<workspaceId>` — workspace-level events (member joined). Future.

## Presence

| Direction | Event             | Payload                                    | When                       |
| --------- | ----------------- | ------------------------------------------ | -------------------------- |
| c→s       | `project:join`    | `{ projectId }`                            | User opens a project view. |
| c→s       | `project:leave`   | `{ projectId }`                            | User leaves a project view.|
| s→c       | `presence:update` | `{ projectId, viewers: User[] }`           | A viewer joins/leaves.     |

`viewers[]` contains `{ id, name, avatarUrl, color }` — minimal, no emails. Used to
render the "who's here" stack in the board header.

## Issue events

All issue events are broadcast to `project:<projectId>`. Payloads always include the
full updated issue where practical so clients can update local caches without a refetch.

| Direction | Event              | Payload                                                  | Emitted by            |
| --------- | ------------------ | -------------------------------------------------------- | --------------------- |
| s→c       | `issue:created`    | `{ issue }`                                              | create issue          |
| s→c       | `issue:updated`    | `{ issue, changes: FieldDiff[] }`                        | patch issue           |
| s→c       | `issue:moved`      | `{ issue, fromStatusId, toStatusId, actorId }`           | move issue (kanban)   |
| s→c       | `issue:deleted`    | `{ issueId }`                                            | soft-delete           |
| s→c       | `issue:assigned`   | `{ issueId, assigneeId, actorId }`                       | assignee changed      |

`FieldDiff = { field: string, from: unknown, to: unknown }` — typed per field in code.

## Comment events

Broadcast to `project:<projectId>` and `user:<mentionedUserId>` for mentions.

| Direction | Event               | Payload                              |
| --------- | ------------------- | ------------------------------------ |
| s→c       | `comment:created`   | `{ comment }`                        |
| s→c       | `comment:updated`   | `{ comment }`                        |
| s→c       | `comment:deleted`   | `{ commentId }`                      |

## Sprint events (Phase 5)

| Direction | Event                       | Payload                                          |
| --------- | --------------------------- | ------------------------------------------------ |
| s→c       | `sprint:created`            | `{ sprint }`                                     |
| s→c       | `sprint:updated`            | `{ sprint }`                                     |
| s→c       | `sprint:issue_added`        | `{ sprintId, issueId }`                          |
| s→c       | `sprint:issue_removed`      | `{ sprintId, issueId }`                          |

## Notification events

Sent to `user:<userId>`.

| Direction | Event                | Payload                                  |
| --------- | -------------------- | ---------------------------------------- |
| s→c       | `notification:new`   | `{ notification }`                       |
| s→c       | `notification:read`  | `{ id } \| { all: true }`                |
| s→c       | `notification:count` | `{ unread }`                             |

## GitHub-derived events (Phase 7+)

Surfaced into the project room (and the linked issue):

| Direction | Event             | Payload                                          |
| --------- | ----------------- | ------------------------------------------------ |
| s→c       | `github:branch`    | `{ issueId, branch }`                            |
| s→c       | `github:pr`        | `{ issueId, pullRequest }`                       |
| s→c       | `github:ci`        | `{ issueId, checkRun }`                          |
| s→c       | `github:merged`    | `{ issueId, pullRequestId }` (may trigger move)  |

## Reliability & sync strategy

- **Optimistic + advisory:** the actor's own change is applied optimistically; other
  viewers rely on the socket event. If an event is missed (drop, brief disconnect),
  the periodic refetch / reconnect-refetch reconciles state.
- **Reconnect:** on `connect` (after a reconnect), the client refetches the active view
  (board or issue) to reconcile. We do not rely on a server replay buffer in MVP.
- **Ordering:** events for the same issue carry the issue `updatedAt`; clients ignore
  events older than their latest-known state for that issue (last-writer-wins guard).
- **Backpressure:** event payloads are kept small (no nested comments arrays on move);
  lists are loaded via REST, not streamed.

## Authorization

- The socket middleware resolves `userId` and **re-checks** project membership on
  `project:join`. A user who loses access mid-session is kicked from the room.
- The server never emits into a room a socket shouldn't be in; rooms are joined only
  after membership verification.

## Naming & versioning

- Event names are namespaced by domain (`issue:*`, `comment:*`, `presence:*`) and stable.
- Breaking changes to payloads require a new event name or a negotiated version flag —
  we do not silently change payloads on the wire.
