import {
	IAdminStatsRepository,
	HourlyActivity,
} from "../../../domain/admin/repositories/IAdminStatsRepository";

export class GetHourlyActivity {
	constructor(private readonly statsRepository: IAdminStatsRepository) { }

	async execute(): Promise<HourlyActivity[]> {
		return this.statsRepository.getHourlyActivity();
	}
}
