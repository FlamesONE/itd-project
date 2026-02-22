import { createServer, type IncomingMessage, type ServerResponse, type Server } from "http";
import { parse as parseUrl } from "url";
import { getSSEManager } from "../../infrastructure/services/realtime";
import { JwtTokenService } from "../../infrastructure/services/JwtTokenService";

const tokenService = new JwtTokenService();

export function createSSEServer(port: number): Server {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parseUrl(req.url || "", true);
    const pathname = parsedUrl.pathname;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (pathname === "/events/health") {
      const stats = getSSEManager().getStats();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "ok",
        connections: stats.totalConnections,
        uniqueUsers: stats.uniqueUsers,
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    if (pathname === "/events/online") {
      const sseManager = getSSEManager();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        users: sseManager.getOnlineUserIds(),
        count: sseManager.getOnlineUserIds().length,
      }));
      return;
    }

    if (pathname === "/events") {

      const userId = await authenticateRequest(req, parsedUrl.query);

      if (!userId) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }

      req.socket.setTimeout(0);
      req.socket.setNoDelay(true);
      req.socket.setKeepAlive(true);

      const sseManager = getSSEManager();
      sseManager.addConnection(userId, res);

      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  server.listen(port, () => {
    console.log(`SSE server ready on port ${port}`);
  });

  return server;
}

async function authenticateRequest(
  req: IncomingMessage,
  query: Record<string, string | string[] | undefined>
): Promise<string | null> {
  try {

    const authHeader = req.headers.authorization;
    let token: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else if (typeof query.token === "string") {

      token = query.token;
    }

    if (!token) {
      return null;
    }

    const payload = await tokenService.verifyAccessToken(token);
    if (!payload) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}

export function shutdownSSEServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    getSSEManager().shutdown();
    server.close(() => {
      console.log("SSE server closed");
      resolve();
    });
  });
}
