import { ValueObject } from "../../shared";
import { Result } from "../../shared/Result";

export interface MouseMovement {
  x: number;
  y: number;
  timestamp: number;
}

export interface ClickEvent {
  x: number;
  y: number;
  timestamp: number;
  target?: string;
}

export interface ScrollEvent {
  scrollY: number;
  timestamp: number;
}

interface BehaviorMetricsProps {
  mouseMovements: MouseMovement[];
  clicks: ClickEvent[];
  keyIntervals: number[];
  scrollEvents: ScrollEvent[];
  sessionDuration: number;
}

export class BehaviorMetrics extends ValueObject<BehaviorMetricsProps> {
  get mouseMovements(): MouseMovement[] {
    return this.props.mouseMovements;
  }

  get clicks(): ClickEvent[] {
    return this.props.clicks;
  }

  get keyIntervals(): number[] {
    return this.props.keyIntervals;
  }

  get scrollEvents(): ScrollEvent[] {
    return this.props.scrollEvents;
  }

  get sessionDuration(): number {
    return this.props.sessionDuration;
  }

  public static create(props: Partial<BehaviorMetricsProps>): Result<BehaviorMetrics> {
    return Result.ok(
      new BehaviorMetrics({
        mouseMovements: props.mouseMovements ?? [],
        clicks: props.clicks ?? [],
        keyIntervals: props.keyIntervals ?? [],
        scrollEvents: props.scrollEvents ?? [],
        sessionDuration: props.sessionDuration ?? 0,
      })
    );
  }
}
