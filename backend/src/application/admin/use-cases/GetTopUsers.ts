import {
	IAdminStatsRepository,
	TopUser,
} from "../../../domain/admin/repositories/IAdminStatsRepository";

export class GetTopUsers {
	constructor(private readonly statsRepository: IAdminStatsRepository) { }

	async execute(limit: number = 10): Promise<TopUser[]> {
		return this.statsRepository.getTopUsers(limit);
	}
}
