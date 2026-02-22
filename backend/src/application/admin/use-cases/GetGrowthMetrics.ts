import {
	IAdminStatsRepository,
	GrowthMetric,
} from "../../../domain/admin/repositories/IAdminStatsRepository";

export class GetGrowthMetrics {
	constructor(private readonly statsRepository: IAdminStatsRepository) { }

	async execute(days: number = 30): Promise<GrowthMetric[]> {
		return this.statsRepository.getGrowthMetrics(days);
	}
}
