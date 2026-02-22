import bcrypt from "bcrypt";
import { getEnv } from "../config/env";
import type { IPasswordHasher } from "../../application/identity/use-cases/RegisterUser";
import type { IPasswordVerifier } from "../../application/identity/use-cases/LoginUser";

export class BcryptPasswordHasher implements IPasswordHasher, IPasswordVerifier {
  async hash(password: string): Promise<string> {
    const env = getEnv();
    return bcrypt.hash(password, env.BCRYPT_ROUNDS);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
