import { ValueObject } from "../../shared";
import { Result } from "../../shared/Result";

interface IpReputationProps {
  ip: string;
  score: number;
  isProxy: boolean;
  isVpn: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  country: string | null;
  abuseReports: number;
  lastChecked: Date;
}

export class IpReputation extends ValueObject<IpReputationProps> {
  get ip(): string {
    return this.props.ip;
  }

  get score(): number {
    return this.props.score;
  }

  get isProxy(): boolean {
    return this.props.isProxy;
  }

  get isVpn(): boolean {
    return this.props.isVpn;
  }

  get isTor(): boolean {
    return this.props.isTor;
  }

  get isDatacenter(): boolean {
    return this.props.isDatacenter;
  }

  get country(): string | null {
    return this.props.country;
  }

  get abuseReports(): number {
    return this.props.abuseReports;
  }

  get lastChecked(): Date {
    return this.props.lastChecked;
  }

  get isSuspicious(): boolean {
    return this.props.score < 50 || this.props.isProxy || this.props.isTor;
  }

  get isBlocked(): boolean {
    return this.props.score < 20;
  }

  public static create(props: {
    ip: string;
    score?: number;
    isProxy?: boolean;
    isVpn?: boolean;
    isTor?: boolean;
    isDatacenter?: boolean;
    country?: string | null;
    abuseReports?: number;
  }): Result<IpReputation> {
    if (!props.ip) {
      return Result.fail(new Error("IP address is required"));
    }

    return Result.ok(
      new IpReputation({
        ip: props.ip,
        score: props.score ?? 100,
        isProxy: props.isProxy ?? false,
        isVpn: props.isVpn ?? false,
        isTor: props.isTor ?? false,
        isDatacenter: props.isDatacenter ?? false,
        country: props.country ?? null,
        abuseReports: props.abuseReports ?? 0,
        lastChecked: new Date(),
      })
    );
  }
}
