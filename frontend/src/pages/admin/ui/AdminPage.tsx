import { useState, useMemo } from 'react';
import { Navigate, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Avatar, Button, Spinner } from '@shared/ui';
import {
	useAdminCheckAccess,
	useAdminDashboardStats,
	useAdminUserActivity,
	useAdminTopUsers,
	useAdminHourlyActivity,
	useAdminGrowthMetrics,
	useAdminSearchUsers,
	useAdminGetAllUsers,
} from '@features/admin/hooks/useAdminData';
import type { AdminUserInfo } from '@shared/api/admin';

const ease = [0.22, 1, 0.36, 1] as const;

function formatNumber(num: number): string {
	if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
	if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
	return num.toString();
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('ru-RU', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

function UsersIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</svg>
	);
}

function PostIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
			<polyline points="14,2 14,8 20,8" />
			<line x1="16" y1="13" x2="8" y2="13" />
			<line x1="16" y1="17" x2="8" y2="17" />
		</svg>
	);
}

function HeartIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
		</svg>
	);
}

function CommentIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
		</svg>
	);
}

function OnlineIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<circle cx="12" cy="12" r="10" />
			<circle cx="12" cy="12" r="3" fill="currentColor" />
		</svg>
	);
}

function TrendIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
			<polyline points="17,6 23,6 23,12" />
		</svg>
	);
}

function SearchIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<circle cx="11" cy="11" r="8" />
			<path d="M21 21l-4.35-4.35" />
		</svg>
	);
}

function RefreshIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<polyline points="23,4 23,10 17,10" />
			<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
		</svg>
	);
}

function StatCard({
	title,
	value,
	icon: Icon,
	color = 'brand',
	trend,
	trendLabel,
	delay = 0,
	className = '',
}: {
	title: string;
	value: string | number;
	icon: React.ComponentType<{ className?: string }>;
	color?: 'brand' | 'green' | 'purple' | 'amber' | 'cyan' | 'rose' | 'teal';
	trend?: number;
	trendLabel?: string;
	delay?: number;
	className?: string;
}) {
	const getColorClass = (c: string) => {
		switch (c) {
			case 'brand': return 'text-brand-primary bg-brand-primary/10';
			case 'green': return 'text-green-500 bg-green-500/10';
			case 'purple': return 'text-purple-500 bg-purple-500/10';
			case 'amber': return 'text-amber-500 bg-amber-500/10';
			case 'cyan': return 'text-cyan-500 bg-cyan-500/10';
			case 'rose': return 'text-rose-500 bg-rose-500/10';
			case 'teal': return 'text-teal-500 bg-teal-500/10';
			default: return 'text-gray-500 bg-gray-500/10';
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay, ease: 'easeOut' }}
			className={`relative flex flex-col justify-between rounded-xl bg-surface/30 border border-white/5 p-4 hover:bg-surface/50 transition-colors group ${className}`}
		>
			<div className="flex justify-between items-start mb-2">
				<p className="text-[11px] font-semibold text-muted uppercase tracking-wider truncate mr-2">{title}</p>
				<div className={`p-1.5 rounded-lg transition-opacity ${getColorClass(color)}`}>
					<Icon className="w-3.5 h-3.5" />
				</div>
			</div>

			<div className="flex items-end gap-2 mt-auto">
				<h3 className="text-xl md:text-2xl font-bold text-theme tracking-tight leading-none">
					{value}
				</h3>
				{trend !== undefined && (
					<div className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md mb-0.5 ${trend >= 0
						? 'bg-green-500/10 text-green-500'
						: 'bg-red-500/10 text-red-500'
						}`}>
						{trend >= 0 ? '+' : ''}{trend}%
					</div>
				)}
			</div>

			{trendLabel && trend !== undefined && (
				<p className="text-[10px] text-muted/60 mt-1 truncate">{trendLabel}</p>
			)}
		</motion.div>
	);
}

function ActivityChart({
	data,
	days,
	onDaysChange,
}: {
	data: { date: string; users: number; posts: number; comments: number }[];
	days: number;
	onDaysChange: (days: number) => void;
}) {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

	const maxValue = useMemo(() => {
		return Math.max(...data.map((d) => Math.max(d.users, d.posts, d.comments)), 1);
	}, [data]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay: 0.2, ease }}
			className="relative overflow-visible rounded-xl bg-surface/30 border border-white/5 p-4"
		>
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Активность</h3>
				<div className="flex gap-1 p-1 rounded-lg bg-surface-hover">
					{[7, 14, 30].map((d) => (
						<button
							key={d}
							onClick={() => onDaysChange(d)}
							className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${days === d ? 'bg-theme-inverse text-theme-inverse' : 'text-muted hover:text-theme'
								}`}
						>
							{d}д
						</button>
					))}
				</div>
			</div>

			<div className="flex items-center gap-4 mb-3 text-xs text-muted">
				<div className="flex items-center gap-1.5">
					<div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
					<span>Пользователи</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-2.5 h-2.5 rounded-full bg-green-500" />
					<span>Посты</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
					<span>Комментарии</span>
				</div>
			</div>

			<div className="relative h-40" onMouseLeave={() => setHoveredIndex(null)}>
				
				{hoveredIndex !== null && data[hoveredIndex] && (
					<div
						className="absolute bottom-full left-0 mb-2 z-20 pointer-events-none bg-theme-inverse text-theme-inverse text-xs p-2 rounded-lg shadow-xl whitespace-nowrap"
						style={{
							left: `${(hoveredIndex / (data.length - 1 || 1)) * 100}%`,
							transform: 'translateX(-50%)'
						}}
					>
						<p className="font-bold mb-1">{formatDate(data[hoveredIndex].date)}</p>
						<div className="space-y-0.5">
							<p>Пользователи: {data[hoveredIndex].users}</p>
							<p>Посты: {data[hoveredIndex].posts}</p>
							<p>Комментарии: {data[hoveredIndex].comments}</p>
						</div>
						
						<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-theme-inverse" />
					</div>
				)}

				<div className="absolute inset-0 flex items-end gap-1">
					{data.map((item, i) => {
						const usersH = (item.users / maxValue) * 100;
						const postsH = (item.posts / maxValue) * 100;
						const commentsH = (item.comments / maxValue) * 100;

						return (
							<div
								key={i}
								className="flex-1 h-full flex items-end gap-px group cursor-pointer relative"
								onMouseEnter={() => setHoveredIndex(i)}
							>
								<motion.div
									initial={{ height: 0 }}
									animate={{ height: `${Math.max(usersH, 3)}%` }}
									transition={{ duration: 0.4, delay: i * 0.015, ease }}
									className={`flex-1 bg-brand-primary rounded-t transition-opacity ${hoveredIndex === i ? 'opacity-100' : 'opacity-70'}`}
								/>
								<motion.div
									initial={{ height: 0 }}
									animate={{ height: `${Math.max(postsH, 3)}%` }}
									transition={{ duration: 0.4, delay: i * 0.015 + 0.05, ease }}
									className={`flex-1 bg-green-500 rounded-t transition-opacity ${hoveredIndex === i ? 'opacity-100' : 'opacity-70'}`}
								/>
								<motion.div
									initial={{ height: 0 }}
									animate={{ height: `${Math.max(commentsH, 3)}%` }}
									transition={{ duration: 0.4, delay: i * 0.015 + 0.1, ease }}
									className={`flex-1 bg-amber-500 rounded-t transition-opacity ${hoveredIndex === i ? 'opacity-100' : 'opacity-70'}`}
								/>
							</div>
						);
					})}
				</div>
			</div>

			<div className="flex justify-between mt-3 text-xs text-muted">
				<span>{data[0]?.date?.slice(5).replace('-', '.') || ''}</span>
				<span>{data[data.length - 1]?.date?.slice(5).replace('-', '.') || ''}</span>
			</div>
		</motion.div>
	);
}

function GrowthChart({ data }: { data: { date: string; totalUsers: number }[] }) {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

	const maxUsers = useMemo(() => Math.max(...data.map((d) => d.totalUsers), 1), [data]);
	const minUsers = useMemo(() => Math.min(...data.map((d) => d.totalUsers), 0), [data]);

	const range = maxUsers - minUsers || 1;
	const points = data.map((d, i) => {
		const x = (i / (data.length - 1)) * 100;
		const y = 100 - ((d.totalUsers - minUsers) / range) * 100;
		return `${x},${y}`;
	}).join(' ');

	const firstUsers = data[0]?.totalUsers || 0;
	const lastUsers = data[data.length - 1]?.totalUsers || 0;
	const growth = firstUsers > 0 ? Math.round(((lastUsers - firstUsers) / firstUsers) * 100) : 0;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay: 0.3, ease }}
			className="relative overflow-hidden rounded-xl bg-surface/30 border border-white/5 p-4"
		>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Рост платформы</h3>
					<p className="text-xs text-muted">Динамика регистрации пользователей</p>
				</div>
				<span className={`px-2 py-1 rounded-lg text-sm font-bold ${growth >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
					{growth >= 0 ? '+' : ''}{growth}%
				</span>
			</div>

			<div className="relative h-48 w-full text-brand-primary group" onMouseLeave={() => setHoveredIndex(null)}>
				<svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
					<defs>
						<linearGradient id="growthArea" x1="0%" y1="0%" x2="0%" y2="100%">
							<stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
							<stop offset="100%" stopColor="currentColor" stopOpacity="0" />
						</linearGradient>
						<linearGradient id="growthLine" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
							<stop offset="100%" stopColor="currentColor" stopOpacity="1" />
						</linearGradient>
					</defs>

					
					<motion.path
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 1 }}
						d={`M 0 100 L ${points} L 100 100 Z`}
						fill="url(#growthArea)"
						stroke="none"
					/>

					
					<motion.path
						initial={{ pathLength: 0 }}
						animate={{ pathLength: 1 }}
						transition={{ duration: 1.5, ease: "easeInOut" }}
						d={`M ${points.split(' ')[0] || '0,100'} L ${points}`}
						fill="none"
						stroke="url(#growthLine)"
						strokeWidth="2"
						vectorEffect="non-scaling-stroke"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>

				
				<div className="absolute inset-0 flex items-stretch">
					{data.map((_, i) => (
						<div
							key={i}
							className="flex-1 hover:bg-white/5 transition-colors relative"
							onMouseEnter={() => setHoveredIndex(i)}
						/>
					))}
				</div>

				
				{hoveredIndex !== null && data[hoveredIndex] && (
					<>
						
						<div
							className="absolute w-3 h-3 bg-theme rounded-full border-2 border-brand-primary shadow-[0_0_10px_currentColor] pointer-events-none transition-all duration-75"
							style={{
								left: `${(hoveredIndex / (data.length - 1)) * 100}%`,
								top: `${100 - ((data[hoveredIndex].totalUsers - minUsers) / range) * 100}%`,
								transform: 'translate(-50%, -50%)'
							}}
						/>

						
						<div
							className="absolute bottom-full left-0 mb-3 pointer-events-none"
							style={{
								left: `${(hoveredIndex / (data.length - 1)) * 100}%`,
								transform: 'translateX(-50%)'
							}}
						>
							<div className="bg-theme-inverse text-theme-inverse text-xs px-3 py-2 rounded-xl shadow-xl flex flex-col items-center whitespace-nowrap">
								<span className="font-bold text-sm">{formatNumber(data[hoveredIndex].totalUsers)}</span>
								<span className="opacity-70 text-[10px]">{formatDate(data[hoveredIndex].date)}</span>
							</div>
							<div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-theme-inverse mx-auto" />
						</div>
					</>
				)}
			</div>

			<div className="flex justify-between mt-4">
				<div>
					<p className="text-2xl font-bold text-theme">{formatNumber(lastUsers)}</p>
					<p className="text-xs text-muted">Всего пользователей</p>
				</div>
				<div className="text-right">
					<div className="flex items-center gap-2 justify-end text-brand-primary">
						<UsersIcon className="w-4 h-4" />
						<span className="font-bold">+{formatNumber(lastUsers - firstUsers)}</span>
					</div>
					<p className="text-xs text-muted">За период</p>
				</div>
			</div>
		</motion.div>
	);
}

function HourlyHeatmap({ data }: { data: { hour: number; posts: number; comments: number; likes: number }[] }) {
	const [hoveredHour, setHoveredHour] = useState<number | null>(null);

	const maxActivity = useMemo(() => {
		return Math.max(...data.map((d) => d.posts + d.comments + d.likes), 1);
	}, [data]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay: 0.35, ease }}
			className="relative overflow-hidden rounded-xl bg-surface/30 border border-white/5 p-4"
		>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Активность по часам</h3>
					<p className="text-xs text-muted">Среднее распределение нагрузки</p>
				</div>
				<div className="flex gap-2">
					<div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
				</div>
			</div>

			<div className="h-40 flex items-end justify-between gap-1 group" onMouseLeave={() => setHoveredHour(null)}>
				{Array.from({ length: 24 }).map((_, hour) => {
					const item = data.find(d => d.hour === hour) || { hour, posts: 0, comments: 0, likes: 0 };
					const total = item.posts + item.comments + item.likes;
					const heightPercent = Math.max((total / maxActivity) * 100, 4);

					return (
						<div
							key={hour}
							className="flex-1 h-full flex items-end relative"
							onMouseEnter={() => setHoveredHour(hour)}
						>
							<motion.div
								initial={{ height: 0 }}
								animate={{ height: `${heightPercent}%` }}
								transition={{ duration: 0.5, delay: hour * 0.02, type: "spring", stiffness: 100 }}
								className={`w-full rounded-t-sm transition-colors duration-300 ${hoveredHour === hour
									? 'bg-brand-primary shadow-lg shadow-brand-primary/50'
									: 'bg-brand-primary/40 hover:bg-brand-primary/80'
									}`}
							/>

							
							{hoveredHour === hour && (
								<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
									<div className="bg-theme-inverse text-theme-inverse text-xs px-2 py-1.5 rounded-lg whitespace-nowrap shadow-xl flex flex-col items-center">
										<span className="font-bold">{hour}:00</span>
										<span className="opacity-80">Активность: {total}</span>
									</div>
									<div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-theme-inverse mx-auto" />
								</div>
							)}
						</div>
					);
				})}
			</div>

			<div className="flex justify-between mt-3 text-[10px] text-muted uppercase tracking-wider font-medium">
				<span>00:00</span>
				<span>06:00</span>
				<span>12:00</span>
				<span>18:00</span>
				<span>23:00</span>
			</div>
		</motion.div>
	);
}

function TopUsersCard({ users }: { users: { id: string; username: string; displayName: string; emoji: string; avatarUrl: string | null; engagementScore: number }[] }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay: 0.4, ease }}
			className="rounded-xl bg-surface/30 border border-white/5 overflow-hidden"
		>
			<h3 className="text-sm font-semibold uppercase tracking-wider text-muted p-4 border-b border-white/5">Топ пользователи</h3>

			<ul>
				{users.slice(0, 5).map((user, i) => (
					<motion.li
						key={user.id}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.3, delay: i * 0.05, ease }}
					>
						<NavLink
							to={`/${user.username}`}
							className="flex items-center gap-3 px-5 py-3 hover-highlight"
						>
							<span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-400 text-amber-900' :
								i === 1 ? 'bg-gray-300 text-gray-700' :
									i === 2 ? 'bg-amber-600 text-white' :
										'bg-surface-hover text-muted'
								}`}>
								{i + 1}
							</span>
							<Avatar emoji={user.emoji} src={user.avatarUrl} alt={user.displayName} size="sm" />
							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold text-theme truncate">{user.displayName}</p>
								<p className="text-xs text-muted">@{user.username}</p>
							</div>
							<div className="text-right">
								<p className="text-sm font-semibold text-theme">{formatNumber(user.engagementScore)}</p>
								<p className="text-xs text-muted">очков</p>
							</div>
						</NavLink>
					</motion.li>
				))}
			</ul>
		</motion.div>
	);
}

function UsersManagement() {
	const [searchInput, setSearchInput] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [page, setPage] = useState(0);
	const limit = 20;

	const { users: searchResults, loading: searchLoading } = useAdminSearchUsers(searchQuery, limit, 0);
	const { users: allUsers, total, loading: allLoading } = useAdminGetAllUsers(limit, page * limit);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setSearchQuery(searchInput.trim());
		setPage(0);
	};

	const users = searchQuery ? searchResults : allUsers;
	const loading = searchQuery ? searchLoading : allLoading;
	const totalPages = Math.ceil(total / limit);

	return (
		<div className="space-y-4">
			
			<form onSubmit={handleSearch}>
				<div className="relative">
					<SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
					<input
						type="text"
						placeholder="Поиск по имени, @username или email..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="w-full pl-12 pr-4 py-3 bg-surface-hover rounded-xl text-theme placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all"
					/>
				</div>
			</form>

			
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, ease }}
				className="card overflow-hidden"
			>
				<div className="p-4 border-b border-theme flex items-center justify-between">
					<h3 className="font-bold text-theme">
						{searchQuery ? `Результаты для "${searchQuery}"` : `Все пользователи (${total})`}
					</h3>
					{searchQuery && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setSearchInput('');
								setSearchQuery('');
							}}
						>
							Сбросить
						</Button>
					)}
				</div>

				{loading ? (
					<div className="divide-y divide-theme">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="p-4 flex gap-3 animate-pulse">
								<div className="w-10 h-10 rounded-full bg-surface-hover" />
								<div className="flex-1 space-y-2">
									<div className="h-4 w-32 bg-surface-hover rounded" />
									<div className="h-3 w-48 bg-surface-hover rounded" />
								</div>
							</div>
						))}
					</div>
				) : users.length === 0 ? (
					<div className="p-8 text-center">
						<p className="text-2xl mb-2">🔍</p>
						<p className="text-muted">Пользователи не найдены</p>
					</div>
				) : (
					<>
						<div className="divide-y divide-theme">
							{users.map((user, i) => (
								<UserRow key={user.id} user={user} index={i} />
							))}
						</div>

						
						{!searchQuery && totalPages > 1 && (
							<div className="p-4 border-t border-theme flex items-center justify-between">
								<Button
									variant="outline"
									size="sm"
									disabled={page === 0}
									onClick={() => setPage((p) => p - 1)}
								>
									Назад
								</Button>
								<span className="text-sm text-muted">
									Страница {page + 1} из {totalPages}
								</span>
								<Button
									variant="outline"
									size="sm"
									disabled={page >= totalPages - 1}
									onClick={() => setPage((p) => p + 1)}
								>
									Вперёд
								</Button>
							</div>
						)}
					</>
				)}
			</motion.div>
		</div>
	);
}

function UserRow({ user, index }: { user: AdminUserInfo; index: number }) {
	return (
		<motion.div
			initial={{ opacity: 0, x: -10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3), ease }}
		>
			<NavLink
				to={`/${user.username}`}
				className="flex items-center gap-3 p-4 hover-highlight"
			>
				<Avatar emoji={user.emoji} src={user.avatarUrl} alt={user.displayName} size="md" />
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="font-semibold text-theme truncate">{user.displayName}</span>
						{user.verified && (
							<span className="text-brand-primary">✓</span>
						)}
					</div>
					<p className="text-sm text-muted truncate">@{user.username} · {user.email}</p>
					<div className="flex items-center gap-4 mt-1 text-xs text-muted">
						<span>{user.followersCount} подписчиков</span>
						<span>{user.postsCount} постов</span>
						<span>Регистрация: {formatDate(user.createdAt)}</span>
					</div>
				</div>
			</NavLink>
		</motion.div>
	);
}

export function AdminPage() {
	const [activeTab, setActiveTab] = useState<'dashboard' | 'users'>('dashboard');
	const [activityDays, setActivityDays] = useState(14);

	const { isAdmin, loading: accessLoading } = useAdminCheckAccess();
	const { stats, loading: statsLoading, refetch: refetchStats } = useAdminDashboardStats();
	const { activityData } = useAdminUserActivity(activityDays);
	const { topUsers } = useAdminTopUsers(10);
	const { hourlyActivity } = useAdminHourlyActivity();
	const { growthMetrics } = useAdminGrowthMetrics(30);

	if (accessLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!isAdmin) {
		return <Navigate to="/" replace />;
	}

	const isLoading = statsLoading;

	return (
		<div className="min-h-screen">
			
			<header className="sticky top-0 z-10 bg-theme/80 backdrop-blur-md border-b border-theme">
				<div className="px-4 py-3">
					<div className="flex items-center justify-between">
						<h1 className="text-xl font-bold text-theme">Админ-панель</h1>
						<button
							onClick={() => refetchStats()}
							disabled={isLoading}
							className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-hover text-sm font-medium text-theme hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50"
						>
							<RefreshIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
							Обновить
						</button>
					</div>
				</div>

				
				<div className="flex border-b border-theme">
					<button
						onClick={() => setActiveTab('dashboard')}
						className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'dashboard' ? 'text-theme' : 'text-muted hover:text-theme'
							}`}
					>
						Дашборд
						{activeTab === 'dashboard' && (
							<motion.div
								layoutId="admin-tab"
								className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
							/>
						)}
					</button>
					<button
						onClick={() => setActiveTab('users')}
						className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'users' ? 'text-theme' : 'text-muted hover:text-theme'
							}`}
					>
						Пользователи
						{activeTab === 'users' && (
							<motion.div
								layoutId="admin-tab"
								className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
							/>
						)}
					</button>
				</div>
			</header>

			
			<div className="p-4">
				{activeTab === 'dashboard' ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3, ease }}
						className="space-y-4"
					>
						
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
							<StatCard
								title="Пользователей"
								value={formatNumber(stats?.totalUsers || 0)}
								icon={UsersIcon}
								color="brand"
								trend={stats?.newUsersToday ? Math.round((stats.newUsersToday / (stats.totalUsers || 1)) * 100) : undefined}
								trendLabel="рост базы"
								delay={0}
							/>
							<StatCard
								title="Постов"
								value={formatNumber(stats?.totalPosts || 0)}
								icon={PostIcon}
								color="green"
								trend={stats?.newPostsToday ? Math.round((stats.newPostsToday / (stats.totalPosts || 1)) * 100) : undefined}
								trendLabel="с новыми постами"
								delay={0.05}
							/>
							<StatCard
								title="Онлайн"
								value={stats?.onlineUsers || 0}
								icon={OnlineIcon}
								color="purple"
								trend={undefined}
								trendLabel="сейчас"
								delay={0.1}
							/>
							<StatCard
								title="Вовлечённость"
								value={`${(stats?.engagementRate || 0).toFixed(1)}%`}
								icon={TrendIcon}
								color="amber"
								delay={0.15}
							/>
						</div>

						
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<StatCard
								title="Комментариев"
								value={formatNumber(stats?.totalComments || 0)}
								icon={CommentIcon}
								color="cyan"
								delay={0.1}
							/>
							<StatCard
								title="Лайков"
								value={formatNumber(stats?.totalLikes || 0)}
								icon={HeartIcon}
								color="rose"
								delay={0.15}
							/>
							<StatCard
								title="Новых сегодня"
								value={stats?.newUsersToday || 0}
								icon={UsersIcon}
								color="teal"
								delay={0.2}
							/>
						</div>

						
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							<ActivityChart
								data={activityData}
								days={activityDays}
								onDaysChange={setActivityDays}
							/>
							<GrowthChart data={growthMetrics} />
						</div>

						
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							<HourlyHeatmap data={hourlyActivity} />
							<TopUsersCard users={topUsers} />
						</div>
					</motion.div>
				) : (
					<UsersManagement />
				)}
			</div>
		</div>
	);
}
