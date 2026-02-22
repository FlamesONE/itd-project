import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useMutation } from '@apollo/client/react';
import { Button } from '@shared/ui';
import { UPDATE_PROFILE_MUTATION } from '@shared/api/graphql/users';
import { uploadMedia } from '@shared/api/upload';

interface BannerEditorProps {
	isOpen: boolean;
	onClose: () => void;
}

const COLORS = [
	'#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#84cc16',
	'#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'
];

const BRUSH_SIZES = [2, 5, 10, 20, 40];

type ToolType = 'brush' | 'eraser' | 'fill' | 'rect' | 'circle' | 'line';

export function BannerEditor({ isOpen, onClose }: BannerEditorProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [color, setColor] = useState('#000000');
	const [brushSize, setBrushSize] = useState(5);
	const [saving, setSaving] = useState(false);
	const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
	const [history, setHistory] = useState<ImageData[]>([]);
	const [historyStep, setHistoryStep] = useState(-1);
	const [tool, setTool] = useState<ToolType>('brush');
	const [recentColors, setRecentColors] = useState<string[]>([]);

	const handleColorChange = (newColor: string) => {
		setColor(newColor);
	};

	const startPos = useRef<{ x: number, y: number } | null>(null);
	const snapshot = useRef<ImageData | null>(null);

	const [updateProfile] = useMutation(UPDATE_PROFILE_MUTATION);

	const initCanvas = useCallback(() => {
		if (!canvasRef.current) return;
		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx) return;

		const width = 1200;
		const height = 400;

		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, width, height);
			setHistory([]);
			setHistoryStep(-1);
			const initialState = ctx.getImageData(0, 0, width, height);
			setHistory([initialState]);
			setHistoryStep(0);
		}

		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		setContext(ctx);
	}, []);

	useEffect(() => {
		if (isOpen) {
			setTimeout(initCanvas, 50);
		}
	}, [isOpen, initCanvas]);

	useEffect(() => {
		if (context) {
			if (tool === 'eraser') {
				context.globalCompositeOperation = 'destination-out';
			} else {
				context.globalCompositeOperation = 'source-over';
			}
			context.strokeStyle = color;
			context.fillStyle = color;
			context.lineWidth = brushSize;
		}
	}, [context, color, brushSize, tool]);

	const saveToHistory = useCallback(() => {
		if (!context || !canvasRef.current) return;
		const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
		const newHistory = history.slice(0, historyStep + 1);
		newHistory.push(imageData);
		if (newHistory.length > 20) newHistory.shift();
		setHistory(newHistory);
		setHistoryStep(newHistory.length - 1);
	}, [context, history, historyStep]);

	const handleUndo = () => {
		if (historyStep > 0 && context) {
			const prevStep = historyStep - 1;
			const imageData = history[prevStep];
			context.putImageData(imageData, 0, 0);
			setHistoryStep(prevStep);
		}
	};

	const handleRedo = () => {
		if (historyStep < history.length - 1 && context) {
			const nextStep = historyStep + 1;
			const imageData = history[nextStep];
			context.putImageData(imageData, 0, 0);
			setHistoryStep(nextStep);
		}
	};

	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

			const isCtrl = e.ctrlKey || e.metaKey;

			if (isCtrl && e.code === 'KeyZ' && !e.shiftKey) { e.preventDefault(); handleUndo(); }

			if ((isCtrl && e.code === 'KeyY') || (isCtrl && e.shiftKey && e.code === 'KeyZ')) { e.preventDefault(); handleRedo(); }

			if (e.code === 'KeyB') setTool('brush');
			if (e.code === 'KeyE') setTool('eraser');
			if (e.code === 'KeyF') setTool('fill');
			if (e.code === 'KeyR') setTool('rect');
			if (e.code === 'KeyC') setTool('circle');
			if (e.code === 'KeyL') setTool('line');

			if (e.code === 'BracketLeft') setBrushSize(prev => Math.max(1, prev - 2));
			if (e.code === 'BracketRight') setBrushSize(prev => Math.min(100, prev + 2));
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, handleUndo, handleRedo]);

	const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
		if (!canvasRef.current) return { x: 0, y: 0 };
		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		let clientX, clientY;
		if ('touches' in event) {
			clientX = event.touches[0].clientX;
			clientY = event.touches[0].clientY;
		} else {
			clientX = (event as React.MouseEvent).clientX;
			clientY = (event as React.MouseEvent).clientY;
		}
		return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
	};

	const floodFill = (startX: number, startY: number, fillColor: string) => {
		if (!context || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const width = canvas.width;
		const height = canvas.height;
		const imgData = context.getImageData(0, 0, width, height);
		const data = imgData.data;

		const tempCtx = document.createElement('canvas').getContext('2d');
		if (!tempCtx) return;
		tempCtx.fillStyle = fillColor;

		tempCtx.fillRect(0, 0, 1, 1);
		const fillData = tempCtx.getImageData(0, 0, 1, 1).data;
		const [fr, fg, fb, fa] = [fillData[0], fillData[1], fillData[2], fillData[3]];

		const startPos = (Math.floor(startY) * width + Math.floor(startX)) * 4;
		const [tr, tg, tb, ta] = [data[startPos], data[startPos + 1], data[startPos + 2], data[startPos + 3]];

		if (fr === tr && fg === tg && fb === tb && fa === ta) return;

		const stack = [[Math.floor(startX), Math.floor(startY)]];

		while (stack.length) {
			const [x, y] = stack.pop()!;
			const pos = (y * width + x) * 4;

			if (x < 0 || x >= width || y < 0 || y >= height) continue;
			if (data[pos] === tr && data[pos + 1] === tg && data[pos + 2] === tb && data[pos + 3] === ta) {
				data[pos] = fr;
				data[pos + 1] = fg;
				data[pos + 2] = fb;
				data[pos + 3] = fa;

				stack.push([x + 1, y]);
				stack.push([x - 1, y]);
				stack.push([x, y + 1]);
				stack.push([x, y - 1]);
			}
		}

		context.putImageData(imgData, 0, 0);
		saveToHistory();
	};

	const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
		if (tool !== 'eraser') {
			setRecentColors(prev => {
				if (prev.includes(color) || COLORS.includes(color)) return prev;
				return [color, ...prev].slice(0, 5);
			});
		}
		const { x, y } = getCoordinates(e);

		if (tool === 'fill') {
			floodFill(x, y, color);
			return;
		}

		setIsDrawing(true);
		startPos.current = { x, y };

		if (tool !== 'brush' && tool !== 'eraser' && context && canvasRef.current) {
			snapshot.current = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
		}

		context?.beginPath();
		context?.moveTo(x, y);
	};

	const draw = (e: React.MouseEvent | React.TouchEvent) => {
		if (!isDrawing || !context) return;
		const { x, y } = getCoordinates(e);

		if (tool === 'brush' || tool === 'eraser') {
			context.lineTo(x, y);
			context.stroke();
		} else {

			if (snapshot.current) {
				context.putImageData(snapshot.current, 0, 0);
			}

			context.beginPath();

			if (tool === 'line') {
				context.moveTo(startPos.current!.x, startPos.current!.y);
				context.lineTo(x, y);
			} else if (tool === 'rect') {
				const w = x - startPos.current!.x;
				const h = y - startPos.current!.y;
				context.rect(startPos.current!.x, startPos.current!.y, w, h);
			} else if (tool === 'circle') {
				const radius = Math.sqrt(Math.pow(x - startPos.current!.x, 2) + Math.pow(y - startPos.current!.y, 2));
				context.arc(startPos.current!.x, startPos.current!.y, radius, 0, 2 * Math.PI);
			}

			context.stroke();
		}
	};

	const stopDrawing = () => {
		if (isDrawing) {
			setIsDrawing(false);
			context?.closePath();
			saveToHistory();
			snapshot.current = null;
			startPos.current = null;
		}
	};

	const handleSave = async () => {
		if (!canvasRef.current) return;
		setSaving(true);
		try {
			const tempCanvas = document.createElement('canvas');
			tempCanvas.width = canvasRef.current.width;
			tempCanvas.height = canvasRef.current.height;
			const tempCtx = tempCanvas.getContext('2d');
			if (!tempCtx) throw new Error('Could not create temp canvas');

			tempCtx.fillStyle = '#ffffff';
			tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
			tempCtx.drawImage(canvasRef.current, 0, 0);

			const blob = await new Promise<Blob | null>(resolve =>
				tempCanvas.toBlob(resolve, 'image/jpeg', 0.9)
			);
			if (!blob) throw new Error('Canvas conversion failed');

			const file = new File([blob], 'banner-drawing.jpg', { type: 'image/jpeg' });
			const token = localStorage.getItem('accessToken');
			if (!token) throw new Error('Create account or sign in');

			const uploadedMedia = await uploadMedia(file, token);
			await updateProfile({ variables: { input: { coverUrl: uploadedMedia.url } } });

			onClose();
		} catch (error) {
			console.error('Failed to save banner:', error);
		} finally {
			setSaving(false);
		}
	};

	const handleClear = () => {
		if (!context || !canvasRef.current) return;
		context.fillStyle = '#ffffff';
		context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
		saveToHistory();
	};

	if (!isOpen) return null;

	return createPortal(
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
				onClick={onClose}
			>
				<style>{`
          .bg-checkered {
            background-image:
              linear-gradient(45deg, #e5e5e5 25%, transparent 25%),
              linear-gradient(-45deg, #e5e5e5 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #e5e5e5 75%),
              linear-gradient(-45deg, transparent 75%, #e5e5e5 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
          }
        `}</style>
				<motion.div
					initial={{ scale: 0.95, opacity: 0, y: 20 }}
					animate={{ scale: 1, opacity: 1, y: 0 }}
					exit={{ scale: 0.95, opacity: 0, y: 20 }}
					className="bg-bg-primary rounded-2xl overflow-hidden shadow-2xl w-full max-w-5xl flex flex-col h-[650px] border border-theme"
					onClick={e => e.stopPropagation()}
				>
					
					<div className="h-16 border-b border-theme flex justify-between items-center px-6 bg-surface z-10 shrink-0">
						<div className="flex items-center gap-4">
							<h2 className="text-lg font-bold text-theme">Редактор обложки</h2>
							<div className="h-6 w-px bg-theme/20 mx-2" />
							<div className="flex gap-1">
								<IconButton
									onClick={handleUndo}
									disabled={historyStep <= 0}
									icon={<UndoIcon />}
									tooltip="Отменить (Ctrl+Z)"
								/>
								<IconButton
									onClick={handleRedo}
									disabled={historyStep >= history.length - 1}
									icon={<RedoIcon />}
									tooltip="Вернуть (Ctrl+Y)"
								/>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<Button variant="ghost" onClick={handleClear} disabled={saving} size="sm">Очистить все</Button>
							<Button variant="outline" onClick={onClose} disabled={saving} size="sm">Отмена</Button>
							<Button variant="primary" onClick={handleSave} isLoading={saving} size="sm">Применить</Button>
						</div>
					</div>

					<div className="flex flex-1 overflow-hidden">
						
						<div className="w-64 border-r border-theme bg-surface-hover p-4 flex flex-col gap-6 overflow-y-auto">
							
							<div className="space-y-3">
								<p className="text-xs font-semibold text-muted uppercase tracking-wider">Инструменты</p>
								<div className="grid grid-cols-2 gap-2">
									<ToolButton active={tool === 'brush'} onClick={() => setTool('brush')} icon={<BrushIcon />} label="Кисть" />
									<ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={<EraserIcon />} label="Ластик" />
									<ToolButton active={tool === 'fill'} onClick={() => setTool('fill')} icon={<FillIcon />} label="Заливка" />
									<ToolButton active={tool === 'line'} onClick={() => setTool('line')} icon={<LineIcon />} label="Линия" />
									<ToolButton active={tool === 'rect'} onClick={() => setTool('rect')} icon={<SquareIcon />} label="Прямоугольник" />
									<ToolButton active={tool === 'circle'} onClick={() => setTool('circle')} icon={<CircleIcon />} label="Круг" />
								</div>
							</div>

							
							<div className="space-y-3">
								<div className="flex justify-between items-center">
									<p className="text-xs font-semibold text-muted uppercase tracking-wider">Размер / Толщина</p>
									<span className="text-xs text-theme font-mono">{brushSize}px</span>
								</div>
								<div className="flex items-center gap-2 flex-wrap">
									{BRUSH_SIZES.map(size => (
										<button
											key={size}
											onClick={() => setBrushSize(size)}
											className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${brushSize === size ? 'bg-brand-primary text-white ring-2 ring-brand-primary ring-offset-2 ring-offset-surface' : 'bg-surface text-muted hover:bg-surface-hover hover:text-theme'}`}
										>
											<div className="rounded-full bg-current" style={{ width: Math.min(20, Math.max(4, size / 2)), height: Math.min(20, Math.max(4, size / 2)) }} />
										</button>
									))}
								</div>
								<input
									type="range"
									min="1"
									max="100"
									value={brushSize}
									onChange={(e) => setBrushSize(parseInt(e.target.value))}
									className="w-full accent-brand-primary h-1.5 bg-theme/10 rounded-lg appearance-none cursor-pointer mt-2"
								/>
							</div>

							
							<div className={`space-y-3 transition-opacity duration-200 ${tool === 'eraser' ? 'opacity-50 pointer-events-none' : ''}`}>
								<div className="flex justify-between items-center mb-2">
									<p className="text-xs font-semibold text-muted uppercase tracking-wider">Палитра</p>
									<div
										className="w-5 h-5 rounded-full border border-theme/20 shadow-sm transition-colors"
										style={{ backgroundColor: color }}
									/>
								</div>

								<div className="flex flex-wrap gap-2">
									
									<div className="relative group cursor-pointer w-8 h-8 rounded-full border border-theme/20 shadow-sm overflow-hidden flex items-center justify-center bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-red-500 via-blue-500 to-green-500 hover:scale-110 transition-transform" title="Выбрать свой цвет">
										<input
											type="color"
											value={color}
											onChange={(e) => handleColorChange(e.target.value)}
											className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
										/>
										<div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors pointer-events-none" />
										<span className="relative z-10 text-white font-bold text-lg drop-shadow-md pointer-events-none">+</span>
									</div>

									
									{[...recentColors, ...COLORS].slice(0, 19).map(c => (
										<button
											key={c}
											onClick={() => setColor(c)}
											className={`w-8 h-8 rounded-full border border-theme/10 transition-transform hover:scale-110 ${color === c && tool !== 'eraser' ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-surface scale-110' : ''}`}
											style={{ backgroundColor: c }}
											title={c}
										/>
									))}
								</div>
							</div>
						</div>

						
						<div className="flex-1 bg-[#f0f0f0] relative flex items-center justify-center p-8 overflow-hidden bg-checkered">
							<div className="relative shadow-2xl rounded-lg overflow-hidden bg-white">
								<canvas
									ref={canvasRef}
									onMouseDown={startDrawing}
									onMouseMove={draw}
									onMouseUp={stopDrawing}
									onMouseLeave={stopDrawing}
									onTouchStart={startDrawing}
									onTouchMove={draw}
									onTouchEnd={stopDrawing}
									className={`touch-none block w-[800px] max-w-full h-auto aspect-[3/1] ${tool === 'fill' ? 'cursor-alias' : 'cursor-crosshair'}`}
								/>
							</div>
						</div>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>,
		document.body
	);
}

function ToolButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
	return (
		<button
			onClick={onClick}
			className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all ${active
				? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
				: 'bg-surface text-muted hover:bg-surface-active hover:text-theme'
				}`}
		>
			<div className="w-5 h-5">{icon}</div>
			<span className="text-xs font-medium">{label}</span>
		</button>
	)
}

function IconButton({ onClick, disabled, icon, tooltip }: { onClick: () => void, disabled?: boolean, icon: React.ReactNode, tooltip?: string }) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			title={tooltip}
			className={`p-2 rounded-lg transition-colors ${disabled
				? 'text-muted/30 cursor-not-allowed'
				: 'text-muted hover:text-theme hover:bg-surface-hover'
				}`}
		>
			<div className="w-5 h-5">{icon}</div>
		</button>
	)
}

function BrushIcon() {
	return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" /><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2.5 2.22S2.75 22 17 22c5.6 0 5-2.6 5-5" /></svg>);
}
function EraserIcon() {
	return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" /><path d="M22 21H7" /><path d="m5 11 9 9" /></svg>);
}
function UndoIcon() {
	return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>);
}
function RedoIcon() {
	return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l2.7 2.7" /></svg>);
}
function FillIcon() {
	return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 11 9 21c-1.5 1.5-4 1-5.5-.5S2 16.5 3.5 15l10-10a2 2 0 0 1 2.8 0l2.7 2.7a2 2 0 0 1 0 2.8Z" /><path d="m15 16 4 4" /></svg>)
}
function SquareIcon() {
	return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /></svg>)
}
function CircleIcon() {
	return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /></svg>)
}
function LineIcon() {
	return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5" /></svg>)
}
