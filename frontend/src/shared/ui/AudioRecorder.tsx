import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';

interface AudioRecorderProps {
	onRecordComplete: (audioBlob: Blob, duration: number) => void;
	onCancel: () => void;
	maxDuration?: number;
}

export function AudioRecorder({ onRecordComplete, onCancel, maxDuration = 60 }: AudioRecorderProps) {
	const [duration, setDuration] = useState(0);
	const [audioLevels, setAudioLevels] = useState<number[]>(new Array(40).fill(0.15));
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const startTimeRef = useRef<number>(0);
	const isCancelledRef = useRef<boolean>(false);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);

	useEffect(() => {
		startRecording();
		return () => {
			cleanup();
		};
	}, []);

	const cleanup = () => {
		if (timerRef.current) clearInterval(timerRef.current);
		if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
		if (audioContextRef.current) audioContextRef.current.close();
	};

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

			const audioContext = new AudioContext();
			audioContextRef.current = audioContext;
			const source = audioContext.createMediaStreamSource(stream);
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 128;
			source.connect(analyser);
			analyserRef.current = analyser;

			const updateLevels = () => {
				if (!analyserRef.current) return;
				const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
				analyserRef.current.getByteFrequencyData(dataArray);
				const levels = Array.from(dataArray.slice(0, 40)).map(v => Math.max(0.15, v / 255));
				setAudioLevels(levels);
				animationFrameRef.current = requestAnimationFrame(updateLevels);
			};
			updateLevels();

			const mediaRecorder = new MediaRecorder(stream, {
				mimeType: 'audio/webm;codecs=opus',
			});

			mediaRecorderRef.current = mediaRecorder;
			chunksRef.current = [];

			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunksRef.current.push(e.data);
			};

			mediaRecorder.onstop = () => {
				stream.getTracks().forEach((t) => t.stop());
				cleanup();
				if (!isCancelledRef.current) {
					const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
					const finalDuration = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
					onRecordComplete(audioBlob, finalDuration);
				}
			};

			mediaRecorder.start();
			startTimeRef.current = Date.now();

			timerRef.current = setInterval(() => {
				const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
				setDuration(elapsed);
				if (elapsed >= maxDuration) handleStop();
			}, 100);
		} catch (error) {
			console.error('Microphone error:', error);
			onCancel();
		}
	};

	const handleStop = () => {
		if (mediaRecorderRef.current?.state !== 'inactive') {
			mediaRecorderRef.current?.stop();
		}
	};

	const handleCancel = () => {
		isCancelledRef.current = true;
		handleStop();
		onCancel();
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	return (
		<div className="flex items-center gap-3 py-1">
			
			<button
				onClick={handleCancel}
				className="w-9 h-9 flex items-center justify-center text-muted hover:text-theme hover:bg-surface-hover rounded-full transition-colors"
			>
				<X className="w-5 h-5" />
			</button>

			
			<div className="flex items-center gap-2">
				<span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
				<span className="text-xs text-muted tabular-nums min-w-[32px]">
					{formatTime(duration)}
				</span>
			</div>

			
			<div className="flex-1 flex items-center gap-[1px] h-7">
				{audioLevels.map((level, i) => (
					<div
						key={i}
						className="flex-1 bg-brand-primary rounded-full transition-all duration-75"
						style={{
							height: `${level * 100}%`,
							opacity: 0.4 + level * 0.6,
						}}
					/>
				))}
			</div>

			
			<button
				onClick={handleStop}
				className="w-9 h-9 flex items-center justify-center bg-brand-primary text-white rounded-full hover:bg-brand-primary-hover transition-colors"
			>
				<Send className="w-4 h-4" />
			</button>
		</div>
	);
}
