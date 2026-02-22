import type { Server } from "bun";

export function createHealthServer(port: number = 4003): Server<undefined> {
  const server = Bun.serve({
    port,
    fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/health") {
        return new Response(
          JSON.stringify({
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  console.log(`Health server ready on port ${port}`);
  return server;
}

export function shutdownHealthServer(server: Server<undefined>): Promise<void> {
  return new Promise((resolve) => {
    server.stop();
    console.log("Health server stopped");
    resolve();
  });
}
