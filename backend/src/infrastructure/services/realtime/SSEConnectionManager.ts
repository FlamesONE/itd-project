import type { ServerResponse } from "http";

export interface SSEClient {
  id: string;
  userId: string;
  response: ServerResponse;
  connectedAt: Date;
}

export class SSEConnectionManager {
  private connections = new Map<string, SSEClient>();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startHeartbeat();
  }

  addConnection(userId: string, response: ServerResponse): string {

    const existingClient = this.getClientByUserId(userId);
    if (existingClient) {
      this.removeConnection(existingClient.id);
    }

    const clientId = `${userId}_${Date.now()}`;

    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });

    response.write(`event: connected\ndata: ${JSON.stringify({ clientId, userId })}\n\n`);

    const client: SSEClient = {
      id: clientId,
      userId,
      response,
      connectedAt: new Date(),
    };

    this.connections.set(clientId, client);

    response.on("close", () => {
      this.removeConnection(clientId);
    });

    console.log(`[SSE] Client connected: ${clientId} (user: ${userId}). Total: ${this.connections.size}`);

    return clientId;
  }

  removeConnection(clientId: string): void {
    const client = this.connections.get(clientId);
    if (client) {
      try {
        client.response.end();
      } catch {

      }
      this.connections.delete(clientId);
      console.log(`[SSE] Client disconnected: ${clientId}. Total: ${this.connections.size}`);
    }
  }

  sendToUser(userId: string, event: string, data: unknown): boolean {
    const client = this.getClientByUserId(userId);
    if (!client) {
      return false;
    }

    return this.sendToClient(client, event, data);
  }

  sendToUsers(userIds: string[], event: string, data: unknown): number {
    let sent = 0;
    for (const userId of userIds) {
      if (this.sendToUser(userId, event, data)) {
        sent++;
      }
    }
    return sent;
  }

  broadcast(event: string, data: unknown): number {
    let sent = 0;
    for (const client of this.connections.values()) {
      if (this.sendToClient(client, event, data)) {
        sent++;
      }
    }
    return sent;
  }

  getClientByUserId(userId: string): SSEClient | undefined {
    for (const client of this.connections.values()) {
      if (client.userId === userId) {
        return client;
      }
    }
    return undefined;
  }

  isUserOnline(userId: string): boolean {
    return this.getClientByUserId(userId) !== undefined;
  }

  getOnlineUserIds(): string[] {
    const userIds = new Set<string>();
    for (const client of this.connections.values()) {
      userIds.add(client.userId);
    }
    return Array.from(userIds);
  }

  getStats(): { totalConnections: number; uniqueUsers: number } {
    return {
      totalConnections: this.connections.size,
      uniqueUsers: this.getOnlineUserIds().length,
    };
  }

  private sendToClient(client: SSEClient, event: string, data: unknown): boolean {
    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      client.response.write(message);
      return true;
    } catch (error) {

      this.removeConnection(client.id);
      return false;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const timestamp = Date.now();
      for (const client of this.connections.values()) {
        try {
          client.response.write(`:heartbeat ${timestamp}\n\n`);
        } catch {
          this.removeConnection(client.id);
        }
      }
    }, 30000);
  }

  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    for (const client of this.connections.values()) {
      try {
        client.response.write(`event: shutdown\ndata: {}\n\n`);
        client.response.end();
      } catch {

      }
    }

    this.connections.clear();
    console.log("[SSE] All connections closed");
  }
}

let sseManager: SSEConnectionManager | null = null;

export function getSSEManager(): SSEConnectionManager {
  if (!sseManager) {
    sseManager = new SSEConnectionManager();
  }
  return sseManager;
}
