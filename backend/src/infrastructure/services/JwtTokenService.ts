import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { getEnv } from "../config/env";
import type { ITokenService } from "../../application/identity/use-cases/LoginUser";

export interface AccessTokenPayload extends JWTPayload {
  userId: string;
  email: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  userId: string;
}

export class JwtTokenService implements ITokenService {
  private getSecret(): Uint8Array {
    const env = getEnv();
    return new TextEncoder().encode(env.JWT_SECRET);
  }

  async generateAccessToken(payload: {
    userId: string;
    email: string;
  }): Promise<string> {
    const env = getEnv();

    return new SignJWT({ ...payload, type: "access" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
      .sign(this.getSecret());
  }

  async generateRefreshToken(payload: { userId: string }): Promise<string> {
    const env = getEnv();

    return new SignJWT({ ...payload, type: "refresh" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
      .sign(this.getSecret());
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.getSecret());

      if (payload.type !== "access") {
        return null;
      }

      return payload as AccessTokenPayload;
    } catch {
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.getSecret());

      if (payload.type !== "refresh") {
        return null;
      }

      return payload as RefreshTokenPayload;
    } catch {
      return null;
    }
  }
}
