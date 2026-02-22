import type { IncomingMessage } from "http";
import { getContainer, type Container } from "../../container";
import { JwtTokenService, type AccessTokenPayload } from "../../infrastructure/services/JwtTokenService";
import { createDataLoaders, type DataLoaders } from "./dataloaders";
import { getRedis } from "../../infrastructure/persistence/redis/connection";

export interface GraphQLContext {
  container: Container;
  userId: string | null;
  loaders: DataLoaders;
  ip: string;
  trustScore?: number;
}

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const firstIp = forwardedStr.split(",")[0].trim();
    return firstIp;
  }

  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return req.socket.remoteAddress || "unknown";
}

export async function createContext({
  req,
}: {
  req: IncomingMessage;
}): Promise<GraphQLContext> {
  const container = getContainer();
  let userId: string | null = null;
  let trustScore: number | undefined = undefined;

  const ip = getClientIp(req);

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const tokenService = new JwtTokenService();
    const payload = await tokenService.verifyAccessToken(token);

    if (payload) {
      userId = payload.userId;

      try {
        await container.onlineUsersService.markUserOnline(userId);
        const redis = getRedis();
        const lastSeenKey = `lastSeen:${userId}`;
        const cached = await redis.get(lastSeenKey);
        if (!cached) {
          await container.userRepository.updateLastSeen(userId);
          await redis.set(lastSeenKey, "1", "EX", 60);
        }
      } catch {
      }

      try {
        const { UserId } = await import("../../domain/identity");
        const userIdResult = UserId.create(userId);
        if (userIdResult.isSuccess()) {
          const trustScoreResult = await container.getTrustScore.execute({
            userId: userIdResult.getValue().value,
          });
          if (trustScoreResult.isSuccess()) {
            trustScore = trustScoreResult.getValue().score;
          }
        }
      } catch {
      }
    }
  }

  const loaders = createDataLoaders(container, userId ?? undefined);

  return {
    container,
    userId,
    loaders,
    ip,
    trustScore,
  };
}
