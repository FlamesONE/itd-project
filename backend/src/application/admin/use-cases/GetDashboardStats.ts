import {
	IAdminStatsRepository,
	DashboardStats,
} from "../../../domain/admin/repositories/IAdminStatsRepository";

export class GetDashboardStats {
	constructor(private readonly statsRepository: IAdminStatsRepository) { }

	async execute(): Promise<DashboardStats> {
		return this.statsRepository.getDashboardStats();
	}
}
