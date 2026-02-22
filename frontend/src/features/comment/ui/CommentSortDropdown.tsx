import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export type CommentSortOption = 'popular' | 'newest' | 'oldest';

interface CommentSortDropdownProps {
	value: CommentSortOption;
	onChange: (value: CommentSortOption) => void;
	className?: string;
}

const OPTIONS: { value: CommentSortOption; label: string }[] = [
	{ value: 'popular', label: 'Популярные' },
	{ value: 'newest', label: 'Новые' },
	{ value: 'oldest', label: 'Старые' },
];

export function CommentSortDropdown({
	value,
	onChange,
	className,
}: CommentSortDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const currentOption = OPTIONS.find((opt) => opt.value === value) || OPTIONS[0];

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div ref={dropdownRef} className={clsx('relative inline-block', className)}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={clsx(
					'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
					'border border-theme/50 hover:border-theme transition-colors duration-200',
					'text-theme hover:bg-surface-hover'
				)}
			>
				<span>{currentOption.label}</span>
				<ChevronDown className={clsx('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')} />
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -8, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.95 }}
						transition={{ duration: 0.15 }}
						className={clsx(
							'absolute z-[310] top-full left-0 mt-2 min-w-[140px]',
							'bg-surface border border-theme/50 rounded-xl shadow-xl',
							'overflow-hidden'
						)}
					>
						{OPTIONS.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => {
									onChange(option.value);
									setIsOpen(false);
								}}
								className={clsx(
									'w-full px-4 py-2.5 text-left text-sm transition-colors duration-150',
									'hover:bg-surface-hover',
									option.value === value
										? 'text-brand-primary font-medium'
										: 'text-theme'
								)}
							>
								{option.label}
							</button>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
