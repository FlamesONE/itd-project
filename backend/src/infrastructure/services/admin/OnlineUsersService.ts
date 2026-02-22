import { getRedis } from "../../persistence/redis/connection";

export class OnlineUsersService {
	private readonly ONLINE_TTL_SECONDS = 300;
	private readonly ONLINE_KEY_PREFIX = "user:online:";

	async markUserOnline(userId: string): Promise<void> {
		const redis = getRedis();
		const key = `${this.ONLINE_KEY_PREFIX}${userId}`;
		await redis.setex(key, this.ONLINE_TTL_SECONDS, Date.now().toString());
	}

	async markUserOffline(userId: string): Promise<void> {
		const redis = getRedis();
		const key = `${this.ONLINE_KEY_PREFIX}${userId}`;
		await redis.del(key);
	}

	async isUserOnline(userId: string): Promise<boolean> {
		const redis = getRedis();
		const key = `${this.ONLINE_KEY_PREFIX}${userId}`;
		const result = await redis.get(key);
		return result !== null;
	}

	async getOnlineUsersCount(): Promise<number> {
		const redis = getRedis();
		const keys = await redis.keys(`${this.ONLINE_KEY_PREFIX}*`);
		return keys.length;
	}

	async getOnlineUserIds(): Promise<string[]> {
		const redis = getRedis();
		const keys = await redis.keys(`${this.ONLINE_KEY_PREFIX}*`);
		return keys.map((key) => key.replace(this.ONLINE_KEY_PREFIX, ""));
	}

	async getOnlineUsersInTimeRange(minutes: number): Promise<number> {
		const redis = getRedis();
		const keys = await redis.keys(`${this.ONLINE_KEY_PREFIX}*`);
		const now = Date.now();
		const threshold = now - minutes * 60 * 1000;

		let count = 0;
		for (const key of keys) {
			const timestamp = await redis.get(key);
			if (timestamp && parseInt(timestamp, 10) >= threshold) {
				count++;
			}
		}
		return count;
	}
}
