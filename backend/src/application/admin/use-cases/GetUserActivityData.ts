import {
	IAdminStatsRepository,
	UserActivityData,
} from "../../../domain/admin/repositories/IAdminStatsRepository";

export class GetUserActivityData {
	constructor(private readonly statsRepository: IAdminStatsRepository) { }

	async execute(days: number = 30): Promise<UserActivityData[]> {
		return this.statsRepository.getUserActivityData(days);
	}
}
