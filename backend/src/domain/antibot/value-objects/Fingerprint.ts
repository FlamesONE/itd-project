import * as crypto from "crypto";
import { ValueObject } from "../../shared";
import { Result } from "../../shared/Result";

export interface FingerprintComponents {
  userAgent: string;
  language: string;
  colorDepth?: number;
  screenResolution?: string;
  timezone?: string;
  plugins?: string[];
  canvasHash?: string;
  webglHash?: string;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  touchSupport?: boolean;
}

interface FingerprintProps {
  hash: string;
  components: FingerprintComponents;
}

export class Fingerprint extends ValueObject<FingerprintProps> {
  get hash(): string {
    return this.props.hash;
  }

  get components(): FingerprintComponents {
    return this.props.components;
  }

  public static create(components: FingerprintComponents): Result<Fingerprint> {
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(components))
      .digest("hex");

    return Result.ok(new Fingerprint({ hash, components }));
  }

  public static fromHash(hash: string): Result<Fingerprint> {
    if (!hash || hash.length !== 64) {
      return Result.fail(new Error("Invalid fingerprint hash"));
    }

    return Result.ok(
      new Fingerprint({
        hash,
        components: { userAgent: "", language: "" },
      })
    );
  }
}
