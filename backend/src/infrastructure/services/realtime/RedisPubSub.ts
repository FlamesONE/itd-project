import Redis from "ioredis";
import { getEnv } from "../../config/env";
import { getSSEManager } from "./SSEConnectionManager";

export interface NotificationEvent {
  type: "notification";
  userId: string;
  payload: {
    id: string;
    actorId: string;
    actorUsername: string;
    actorDisplayName: string;
    actorAvatarUrl: string | null;
    actorEmoji: string | null;
    type: string;
    postId: string | null;
    commentId: string | null;
    message: string;
    createdAt: string;
  };
}

export interface CounterUpdateEvent {
  type: "counter_update";
  userId: string;
  payload: {
    unreadCount: number;
  };
}

export type RealtimeEvent = NotificationEvent | CounterUpdateEvent;

const CHANNEL_NOTIFICATIONS = "notifications";

export class RedisPubSub {
  private publisher: Redis;
  private subscriber: Redis;
  private isSubscribed = false;

  constructor() {
    const env = getEnv();

    this.publisher = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.subscriber = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.setupSubscriber();
  }

  private async setupSubscriber(): Promise<void> {
    try {
      await this.subscriber.connect();

      this.subscriber.on("message", (channel, message) => {
        if (channel === CHANNEL_NOTIFICATIONS) {
          this.handleNotificationEvent(message);
        }
      });

      await this.subscriber.subscribe(CHANNEL_NOTIFICATIONS);
      this.isSubscribed = true;
      console.log("[PubSub] Subscribed to notifications channel");
    } catch (error) {
      console.error("[PubSub] Failed to setup subscriber:", error);
    }
  }

  private handleNotificationEvent(message: string): void {
    try {
      const event: RealtimeEvent = JSON.parse(message);
      const sseManager = getSSEManager();

      switch (event.type) {
        case "notification":

          sseManager.sendToUser(event.userId, "notification", event.payload);
          break;

        case "counter_update":

          sseManager.sendToUser(event.userId, "counter_update", event.payload);
          break;
      }
    } catch (error) {
      console.error("[PubSub] Failed to handle notification event:", error);
    }
  }

  async publishNotification(userId: string, notification: NotificationEvent["payload"]): Promise<void> {
    const event: NotificationEvent = {
      type: "notification",
      userId,
      payload: notification,
    };

    await this.publish(CHANNEL_NOTIFICATIONS, event);
  }

  async publishCounterUpdate(userId: string, unreadCount: number): Promise<void> {
    const event: CounterUpdateEvent = {
      type: "counter_update",
      userId,
      payload: { unreadCount },
    };

    await this.publish(CHANNEL_NOTIFICATIONS, event);
  }

  private async publish(channel: string, event: RealtimeEvent): Promise<void> {
    try {
      if (!this.publisher.status || this.publisher.status === "end") {
        await this.publisher.connect();
      }
      await this.publisher.publish(channel, JSON.stringify(event));
    } catch (error) {
      console.error(`[PubSub] Failed to publish to ${channel}:`, error);
    }
  }

  async shutdown(): Promise<void> {
    try {
      if (this.isSubscribed) {
        await this.subscriber.unsubscribe(CHANNEL_NOTIFICATIONS);
      }
      await this.subscriber.quit();
      await this.publisher.quit();
      console.log("[PubSub] Connections closed");
    } catch (error) {
      console.error("[PubSub] Error during shutdown:", error);
    }
  }
}

let pubsub: RedisPubSub | null = null;

export function getRedisPubSub(): RedisPubSub {
  if (!pubsub) {
    pubsub = new RedisPubSub();
  }
  return pubsub;
}
