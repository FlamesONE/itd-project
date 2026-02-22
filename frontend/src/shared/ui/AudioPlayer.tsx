import { useState, useRef, useEffect, useMemo } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
	audioUrl: string;
	duration?: number;
}

const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 1.75, 2];

function generateWaveformBars(seed: string, count: number): number[] {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = ((hash << 5) - hash) + seed.charCodeAt(i);
		hash = hash & hash;
	}

	const bars: number[] = [];
	for (let i = 0; i < count; i++) {
		hash = Math.imul(hash ^ (hash >>> 15), hash | 1);
		hash ^= hash + Math.imul(hash ^ (hash >>> 7), hash | 61);
		const value = ((hash ^ (hash >>> 14)) >>> 0) / 4294967296;
		bars.push(0.3 + value * 0.7);
	}
	return bars;
}

export function AudioPlayer({ audioUrl, duration: providedDuration }: AudioPlayerProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [showVolume, setShowVolume] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [playbackSpeed, setPlaybackSpeed] = useState(1);
	const [isSeeking, setIsSeeking] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const waveformRef = useRef<HTMLDivElement>(null);
	const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const BAR_COUNT = 35;
	const waveformBars = useMemo(() => generateWaveformBars(audioUrl, BAR_COUNT), [audioUrl]);

	useEffect(() => {
		if (providedDuration && isFinite(providedDuration) && providedDuration > 0) {
			setDuration(Math.floor(providedDuration));
		}

		const audio = new Audio(audioUrl);
		audioRef.current = audio;
		audio.volume = volume;
		audio.playbackRate = playbackSpeed;

		const handleLoadedMetadata = () => {
			if (isFinite(audio.duration) && audio.duration > 0) {
				setDuration(Math.floor(audio.duration));
			}
		};

		const handleTimeUpdate = () => {
			if (!isSeeking && isFinite(audio.currentTime)) {
				setCurrentTime(audio.currentTime);
			}
		};

		const handleEnded = () => {
			setIsPlaying(false);
			setCurrentTime(0);
		};

		audio.addEventListener('loadedmetadata', handleLoadedMetadata);
		audio.addEventListener('timeupdate', handleTimeUpdate);
		audio.addEventListener('ended', handleEnded);

		return () => {
			audio.pause();
			audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
			audio.removeEventListener('timeupdate', handleTimeUpdate);
			audio.removeEventListener('ended', handleEnded);
			audio.remove();
		};
	}, [audioUrl, providedDuration]);

	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = isMuted ? 0 : volume;
		}
	}, [volume, isMuted]);

	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.playbackRate = playbackSpeed;
		}
	}, [playbackSpeed]);

	const togglePlayPause = () => {
		if (!audioRef.current) return;
		if (isPlaying) {
			audioRef.current.pause();
		} else {
			audioRef.current.play();
		}
		setIsPlaying(!isPlaying);
	};

	const cyclePlaybackSpeed = () => {
		const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
		const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
		setPlaybackSpeed(PLAYBACK_SPEEDS[nextIndex]);
	};

	const handleSeek = (clientX: number) => {
		if (!audioRef.current || !waveformRef.current || !duration) return;
		const rect = waveformRef.current.getBoundingClientRect();
		const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		const newTime = percent * duration;
		if (isFinite(newTime)) {
			audioRef.current.currentTime = newTime;
			setCurrentTime(newTime);
		}
	};

	const handleWaveformMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsSeeking(true);
		handleSeek(e.clientX);

		const handleMouseMove = (moveEvent: MouseEvent) => {
			handleSeek(moveEvent.clientX);
		};

		const handleMouseUp = () => {
			setIsSeeking(false);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	};

	const handleWaveformTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
		setIsSeeking(true);
		handleSeek(e.touches[0].clientX);

		const handleTouchMove = (moveEvent: TouchEvent) => {
			moveEvent.preventDefault();
			handleSeek(moveEvent.touches[0].clientX);
		};

		const handleTouchEnd = () => {
			setIsSeeking(false);
			document.removeEventListener('touchmove', handleTouchMove);
			document.removeEventListener('touchend', handleTouchEnd);
		};

		document.addEventListener('touchmove', handleTouchMove, { passive: false });
		document.addEventListener('touchend', handleTouchEnd);
	};

	const formatTime = (seconds: number) => {
		if (!isFinite(seconds) || seconds < 0) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

	return (
		<div className="flex items-center gap-2 py-1 max-w-[320px]">
			
			<button
				onClick={togglePlayPause}
				className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-brand-primary text-white rounded-full hover:bg-brand-primary-hover transition-colors"
			>
				{isPlaying ? (
					<Pause className="w-4 h-4" fill="currentColor" />
				) : (
					<Play className="w-4 h-4 ml-0.5" fill="currentColor" />
				)}
			</button>

			
			<div
				ref={waveformRef}
				onMouseDown={handleWaveformMouseDown}
				onTouchStart={handleWaveformTouchStart}
				className="flex-1 flex items-center gap-[2px] h-8 cursor-pointer min-w-[100px] select-none"
			>
				{waveformBars.map((height, i) => {
					const barProgress = i / BAR_COUNT;
					const isPlayed = barProgress <= progress;
					return (
						<div
							key={i}
							className="w-[3px] rounded-full transition-colors duration-75"
							style={{
								height: `${height * 100}%`,
								backgroundColor: isPlayed ? '#1d9bf0' : '#71767b',
								opacity: isPlayed ? 1 : 0.4,
							}}
						/>
					);
				})}
			</div>

			
			<span className="text-xs text-muted tabular-nums flex-shrink-0 min-w-[32px]">
				{formatTime(isPlaying || currentTime > 0 ? currentTime : duration)}
			</span>

			
			<button
				onClick={cyclePlaybackSpeed}
				className="text-xs text-muted hover:text-theme transition-colors px-1.5 py-0.5 rounded bg-surface-hover flex-shrink-0 min-w-[36px] font-medium"
			>
				{playbackSpeed}x
			</button>

			
			<div
				className="relative flex-shrink-0 flex items-center"
				onMouseEnter={() => {
					if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
					setShowVolume(true);
				}}
				onMouseLeave={() => {
					volumeTimeoutRef.current = setTimeout(() => setShowVolume(false), 300);
				}}
			>
				<button
					onClick={() => {
						setIsMuted(!isMuted);
						setShowVolume(true);
						if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
						volumeTimeoutRef.current = setTimeout(() => setShowVolume(false), 2000);
					}}
					className="p-1 text-muted hover:text-theme transition-colors"
				>
					{isMuted || volume === 0 ? (
						<VolumeX className="w-4 h-4" />
					) : (
						<Volume2 className="w-4 h-4" />
					)}
				</button>

				{showVolume && (
					<div className="flex items-center ml-1">
						<input
							type="range"
							min="0"
							max="1"
							step="0.05"
							value={isMuted ? 0 : volume}
							onChange={(e) => {
								const newVolume = parseFloat(e.target.value);
								setVolume(newVolume);
								if (newVolume > 0) setIsMuted(false);
								else setIsMuted(true);
							}}
							className="w-14 h-1 accent-brand-primary cursor-pointer"
							style={{
								background: `linear-gradient(to right, #1d9bf0 ${(isMuted ? 0 : volume) * 100}%, #71767b ${(isMuted ? 0 : volume) * 100}%)`
							}}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
