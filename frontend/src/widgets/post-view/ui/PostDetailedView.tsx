import { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { Avatar, VerifiedBadge, MoreIcon, HeartIcon, RepostIcon, Spinner, SendIcon, AudioRecorder } from '@shared/ui';
import { formatTimeAgo, formatCount, parseContent } from '@shared/lib';
import { COMMENTS_QUERY, CREATE_COMMENT_MUTATION, REPLY_TO_COMMENT_MUTATION, COMMENT_REPLIES_QUERY } from '@shared/api/graphql/comments';
import { LIKE_POST_MUTATION, UNLIKE_POST_MUTATION } from '@shared/api/graphql/posts';
import { RepostModal } from '@features/post/repost';
import { PostMedia } from '@widgets/post-card/ui/PostMedia';
import { UserHoverCard } from '@features/user/user-hover-card';
import { PostActionsMenu } from '@features/post/post-actions-menu';
import { useAuth } from '@app/providers/AuthProvider';
import type { Post } from '@entities/post';
import type { Comment } from '@entities/comment';
import { CommentItem } from './CommentItem';
import { X, Mic } from 'lucide-react';
import { MarkNotificationAsReadMutation } from '@shared/api/graphql/notifications';

interface PostDetailedViewProps {
	post: Post;
	onClose?: () => void;
	onLinkClick?: () => void;
	className?: string;
	hideHeader?: boolean;
}

interface ReplyingTo {
	commentId: string;
	authorName: string;
}

type CommentSortBy = 'NEWEST' | 'POPULAR';

export function PostDetailedView({ post, onClose, onLinkClick, className = '', hideHeader = false }: PostDetailedViewProps) {
	const { user } = useAuth();
	const [commentText, setCommentText] = useState('');
	const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
	const [repostModalOpen, setRepostModalOpen] = useState(false);
	const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
	const [commentsSortBy, setCommentsSortBy] = useState<CommentSortBy>('POPULAR');
	const [isRecordingAudio, setIsRecordingAudio] = useState(false);
	const [uploadingAudio, setUploadingAudio] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const [localPost, setLocalPost] = useState<Post>(post);
	const commentsContainerRef = useRef<HTMLDivElement>(null);
	const COMMENTS_PER_PAGE = 20;

	useEffect(() => {
		setLocalPost(post);
	}, [post]);

	useEffect(() => {
		if (replyingTo && inputRef.current) {
			inputRef.current.focus();
		}
	}, [replyingTo]);

	const { data: commentsData, loading: commentsLoading, fetchMore } = useQuery(COMMENTS_QUERY, {
		variables: {
			postId: post.id,
			limit: COMMENTS_PER_PAGE,
			offset: 0,
			sortBy: commentsSortBy
		} as any,
		skip: !post.id,
		notifyOnNetworkStatusChange: true,
	});

	const comments: Comment[] = (commentsData?.comments as Comment[]) || [];
	const isLoadingMoreRef = useRef(false);
	const lastOffsetRef = useRef(0);
	const loadMoreRef = useRef<(() => Promise<void>) | null>(null);

	useEffect(() => {
		if (commentsContainerRef.current) {
			commentsContainerRef.current.scrollTop = 0;
		}
		isLoadingMoreRef.current = false;
		lastOffsetRef.current = 0;
	}, [commentsSortBy]);

	useEffect(() => {
		lastOffsetRef.current = comments.length;
	}, [comments.length]);

	const loadMoreComments = useCallback(async () => {
		if (isLoadingMoreRef.current || commentsLoading) return;

		const currentOffset = lastOffsetRef.current;
		const totalCount = localPost.commentsCount || 0;

		if (currentOffset >= totalCount) {
			return;
		}

		isLoadingMoreRef.current = true;
		try {
			const result = await fetchMore({
				variables: {
					postId: post.id,
					offset: currentOffset,
					limit: COMMENTS_PER_PAGE,
					sortBy: commentsSortBy,
				} as any,
			});

			const newComments = (result.data?.comments as Comment[]) || [];
			if (newComments.length > 0) {
				lastOffsetRef.current = currentOffset + newComments.length;
			} else {
				lastOffsetRef.current = totalCount;
			}
		} catch (error) {
			console.error('Error loading more comments:', error);
		} finally {
			isLoadingMoreRef.current = false;
		}
	}, [fetchMore, commentsLoading, commentsSortBy, post.id, localPost.commentsCount]);

	useEffect(() => {
		loadMoreRef.current = loadMoreComments;
	}, [loadMoreComments]);

	useEffect(() => {
		const container = commentsContainerRef.current;
		if (!container) return;

		let rafId: number | null = null;
		let lastScrollTop = 0;
		let lastCheckTime = 0;

		const handleScroll = () => {
			const now = Date.now();
			if (now - lastCheckTime < 200) {
				return;
			}
			lastCheckTime = now;

			if (rafId !== null) return;

			rafId = requestAnimationFrame(() => {
				const { scrollTop, scrollHeight, clientHeight } = container;

				if (scrollTop <= lastScrollTop) {
					lastScrollTop = scrollTop;
					rafId = null;
					return;
				}
				lastScrollTop = scrollTop;

				if (scrollHeight <= clientHeight) {
					rafId = null;
					return;
				}

				const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
				const currentOffset = lastOffsetRef.current;
				const totalCount = localPost.commentsCount || 0;

				if (
					scrollPercentage >= 0.85 &&
					currentOffset < totalCount &&
					!commentsLoading &&
					!isLoadingMoreRef.current &&
					loadMoreRef.current
				) {
					loadMoreRef.current();
				}

				rafId = null;
			});
		};

		container.addEventListener('scroll', handleScroll, { passive: true });
		return () => {
			container.removeEventListener('scroll', handleScroll);
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}
		};
	}, [commentsLoading, localPost.commentsCount]);

	const [createComment, { loading: commentLoading }] = useMutation(CREATE_COMMENT_MUTATION, {
		refetchQueries: [{ query: COMMENTS_QUERY, variables: { postId: post.id, limit: COMMENTS_PER_PAGE, offset: 0, sortBy: commentsSortBy } }],
		onCompleted: () => {
			setCommentText('');
			setLocalPost(prev => ({ ...prev, commentsCount: prev.commentsCount + 1 }));
		},
	});

	const [replyToComment, { loading: replyLoading }] = useMutation(REPLY_TO_COMMENT_MUTATION, {
		onCompleted: () => {
			if (replyingTo) {
				setExpandedReplies(prev => new Set(prev).add(replyingTo.commentId));
			}
			setCommentText('');
			setReplyingTo(null);
		},
	});

	const submitting = commentLoading || replyLoading;

	const [likePost] = useMutation(LIKE_POST_MUTATION);
	const [unlikePost] = useMutation(UNLIKE_POST_MUTATION);
	const [markRead] = useMutation(MarkNotificationAsReadMutation);

	useEffect(() => {
		if (user && post.id) {
			markRead({ variables: { postId: post.id } }).catch(() => { });
		}
	}, [post.id, user, markRead]);

	const handleLikePost = async () => {
		const wasLiked = localPost.isLiked;
		setLocalPost({
			...localPost,
			isLiked: !wasLiked,
			likesCount: wasLiked ? localPost.likesCount - 1 : localPost.likesCount + 1,
		});
		try {
			if (wasLiked) {
				await unlikePost({ variables: { postId: localPost.id } });
			} else {
				await likePost({ variables: { postId: localPost.id } });
			}
		} catch {
			setLocalPost(localPost);
		}
	};

	const handleRepostClick = () => {
		setRepostModalOpen(true);
	};

	const uploadAudioFile = async (audioBlob: Blob): Promise<string> => {
		const formData = new FormData();
		formData.append('file', audioBlob, 'voice-message.webm');

		const token = localStorage.getItem('accessToken');
		const response = await fetch('/upload', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: formData,
		});

		if (!response.ok) {
			throw new Error('Failed to upload audio');
		}

		const data = await response.json();
		return data.url;
	};

	const handleSubmitComment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!commentText.trim() || !post.id) return;

		if (replyingTo) {
			await replyToComment({
				variables: {
					postId: post.id,
					parentCommentId: replyingTo.commentId,
					content: commentText.trim(),
					audioUrl: null,
					audioDuration: null,
				},
				refetchQueries: [
					{ query: COMMENT_REPLIES_QUERY, variables: { commentId: replyingTo.commentId, limit: 20, offset: 0 } },
				],
			});
		} else {
			await createComment({
				variables: {
					postId: post.id,
					content: commentText.trim(),
					audioUrl: null,
					audioDuration: null,
				},
			});
		}
	};

	const handleAudioRecordComplete = async (audioBlob: Blob, duration: number) => {
		try {
			setUploadingAudio(true);
			const audioUrl = await uploadAudioFile(audioBlob);

			if (replyingTo) {
				await replyToComment({
					variables: {
						postId: post.id,
						parentCommentId: replyingTo.commentId,
						content: null,
						audioUrl,
						audioDuration: duration,
					},
					refetchQueries: [
						{ query: COMMENT_REPLIES_QUERY, variables: { commentId: replyingTo.commentId, limit: 20, offset: 0 } },
					],
				});
			} else {
				await createComment({
					variables: {
						postId: post.id,
						content: null,
						audioUrl,
						audioDuration: duration,
					},
				});
			}

			setIsRecordingAudio(false);
			setReplyingTo(null);
		} catch (error) {
			console.error('Failed to upload audio:', error);
			alert('Не удалось отправить голосовое сообщение');
		} finally {
			setUploadingAudio(false);
		}
	};

	const handleStartRecording = () => {
		setIsRecordingAudio(true);
	};

	const handleCancelRecording = () => {
		setIsRecordingAudio(false);
	};

	const handleReply = (commentId: string, authorName: string, mentionUsername?: string) => {
		setReplyingTo({ commentId, authorName });
		if (mentionUsername) {
			setCommentText(`@${mentionUsername} `);
		}
	};

	const cancelReply = () => {
		setReplyingTo(null);
		setCommentText('');
	};

	const handleSortChange = (sortBy: CommentSortBy) => {
		setCommentsSortBy(sortBy);
		setExpandedReplies(new Set());
	};

	const hasMedia = localPost.media && localPost.media.length > 0;

	return (
		<div className={`flex flex-col h-full overflow-hidden ${className}`}>
			
			{!hideHeader && (
				<div className="flex items-center gap-3 p-4 border-b border-theme shrink-0">
					<UserHoverCard userId={localPost.author.id}>
						<NavLink to={`/${localPost.author.username}`} onClick={onLinkClick}>
							<Avatar
								emoji={localPost.author.emoji}
								src={localPost.author.avatarUrl}
								alt={localPost.author.displayName}
								size="md"
							/>
						</NavLink>
					</UserHoverCard>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-1">
							<UserHoverCard userId={localPost.author.id}>
								<NavLink
									to={`/${localPost.author.username}`}
									className="font-semibold text-theme text-[15px] hover:underline"
									onClick={onLinkClick}
								>
									{localPost.author.displayName}
								</NavLink>
							</UserHoverCard>
							{localPost.author.verified && (
								<VerifiedBadge className="w-4 h-4 text-brand-primary" />
							)}
						</div>
						<p className="text-xs text-muted">@{localPost.author.username} · {formatTimeAgo(localPost.createdAt)}</p>
					</div>
					<div className="flex items-center gap-1">
						<PostActionsMenu
							trigger={
								<button className="p-2 rounded-full text-muted hover:text-theme hover:bg-surface-hover transition-colors">
									<MoreIcon className="w-5 h-5" />
								</button>
							}
							postId={localPost.id}
							authorId={localPost.author.id}
							authorName={localPost.author.displayName}
							currentUserId={user?.id}
						/>
						{onClose && (
							<button
								onClick={onClose}
								className="p-2 rounded-full text-muted hover:text-theme hover:bg-surface-hover transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						)}
					</div>
				</div>
			)}

			
			<div className={`flex-1 overflow-y-auto ${hideHeader ? '' : ''}`} ref={commentsContainerRef}>
				
				{hideHeader && (
					<div className="flex items-center gap-3 p-4 border-b border-theme">
						<UserHoverCard userId={localPost.author.id}>
							<NavLink to={`/${localPost.author.username}`} onClick={onLinkClick}>
								<Avatar
									emoji={localPost.author.emoji}
									src={localPost.author.avatarUrl}
									alt={localPost.author.displayName}
									size="md"
								/>
							</NavLink>
						</UserHoverCard>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-1">
								<UserHoverCard userId={localPost.author.id}>
									<NavLink
										to={`/${localPost.author.username}`}
										className="font-semibold text-theme text-[15px] hover:underline"
										onClick={onLinkClick}
									>
										{localPost.author.displayName}
									</NavLink>
								</UserHoverCard>
								{localPost.author.verified && (
									<VerifiedBadge className="w-4 h-4 text-brand-primary" />
								)}
							</div>
							<p className="text-xs text-muted">@{localPost.author.username} · {formatTimeAgo(localPost.createdAt)}</p>
						</div>
						<PostActionsMenu
							trigger={
								<button className="p-2 rounded-full text-muted hover:text-theme hover:bg-surface-hover transition-colors">
									<MoreIcon className="w-5 h-5" />
								</button>
							}
							postId={localPost.id}
							authorId={localPost.author.id}
							authorName={localPost.author.displayName}
							currentUserId={user?.id}
						/>
					</div>
				)}

				
				{localPost.content && (
					<div className="p-4">
						<p className="text-theme text-[15px] leading-relaxed whitespace-pre-wrap break-words">
							{parseContent(localPost.content)}
						</p>
					</div>
				)}

				
				{hasMedia && (
					<div className="px-4 pb-4">
						<PostMedia media={localPost.media} />
					</div>
				)}

				
				<div className="flex items-center gap-6 px-4 py-3 border-t border-b border-theme text-sm">
					<span className="text-muted">
						<span className="font-semibold text-theme">{formatCount(localPost.likesCount)}</span> отметок
					</span>
					<span className="text-muted">
						<span className="font-semibold text-theme">{formatCount(localPost.commentsCount)}</span> комментариев
					</span>
					<span className="text-muted">
						<span className="font-semibold text-theme">{formatCount(localPost.viewsCount)}</span> просмотров
					</span>
				</div>

				
				<div className="flex items-center gap-1 px-4 py-2 border-b border-theme">
					<button
						onClick={handleLikePost}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${localPost.isLiked
							? 'text-red-500'
							: 'text-muted hover:text-red-500'
							}`}
					>
						<HeartIcon filled={localPost.isLiked} className="w-[18px] h-[18px]" />
						{localPost.likesCount > 0 && (
							<span className="text-xs tabular-nums">{formatCount(localPost.likesCount)}</span>
						)}
					</button>

					<button
						onClick={handleRepostClick}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${localPost.isReposted
							? 'text-green-500'
							: 'text-muted hover:text-green-500'
							}`}
					>
						<RepostIcon className="w-[18px] h-[18px]" />
						{localPost.repostsCount > 0 && (
							<span className="text-xs tabular-nums">{formatCount(localPost.repostsCount)}</span>
						)}
					</button>
				</div>

				
				<div className="divide-y divide-theme">
					
					{!commentsLoading && (comments.length > 0 || localPost.commentsCount > 0) && (
						<div className="flex items-center justify-between px-4 py-2 bg-surface-hover/30 sticky top-0 z-10 bg-blur-sm bg-surface-hover/50">
							<span className="text-xs text-muted">
								{localPost.commentsCount || 0} {localPost.commentsCount === 1 ? 'комментарий' : localPost.commentsCount < 5 ? 'комментария' : 'комментариев'}
							</span>
							<div className="flex items-center gap-2">
								<button
									onClick={() => handleSortChange('POPULAR')}
									className={`text-xs transition-colors ${commentsSortBy === 'POPULAR' ? 'text-brand-primary font-medium' : 'text-muted hover:text-theme'}`}
								>
									Популярные
								</button>
								<span className="text-muted text-xs">|</span>
								<button
									onClick={() => handleSortChange('NEWEST')}
									className={`text-xs transition-colors ${commentsSortBy === 'NEWEST' ? 'text-brand-primary font-medium' : 'text-muted hover:text-theme'}`}
								>
									Новые
								</button>
							</div>
						</div>
					)}
					{commentsLoading && comments.length === 0 ? (
						<div className="flex justify-center py-8">
							<Spinner size="lg" />
						</div>
					) : comments.length > 0 ? (
						<>
							{comments.map((comment, index) => (
								<CommentItem
									key={comment.id}
									comment={comment}
									index={index}
									onReply={handleReply}
									expandedReplies={expandedReplies}
									setExpandedReplies={setExpandedReplies}
									onLinkClick={onLinkClick}
								/>
							))}
							
							{commentsLoading && comments.length > 0 && (
								<div className="flex justify-center py-4">
									<Spinner size="sm" />
								</div>
							)}
						</>
					) : (
						<div className="py-12 text-center">
							<p className="text-muted text-sm">Пока нет комментариев</p>
							<p className="text-muted text-xs mt-1">Будьте первым!</p>
						</div>
					)}
				</div>
			</div>

			
			<div className="border-t border-theme shrink-0">
				{replyingTo && (
					<div className="flex items-center justify-between px-4 py-2.5 bg-surface-hover text-xs">
						<span className="text-muted">
							Ответ для <span className="font-medium text-theme">{replyingTo.authorName}</span>
						</span>
						<button onClick={cancelReply} className="text-muted hover:text-theme p-1">
							<X className="w-3.5 h-3.5" />
						</button>
					</div>
				)}
				{isRecordingAudio ? (
					<div className="px-4 py-3">
						<AudioRecorder
							onRecordComplete={handleAudioRecordComplete}
							onCancel={handleCancelRecording}
						/>
					</div>
				) : uploadingAudio ? (
					<div className="px-4 py-3 flex items-center justify-center gap-2">
						<Spinner size="sm" />
						<span className="text-sm text-muted">Отправка голосового сообщения...</span>
					</div>
				) : (
					<form onSubmit={handleSubmitComment} className="px-4 py-3">
						<div className="flex items-center gap-3">
							{user && (
								<Avatar
									emoji={user.emoji}
									src={user.avatarUrl}
									alt={user.displayName}
									size="sm"
									className="shrink-0"
								/>
							)}
						<input
							ref={inputRef}
							type="text"
							value={commentText}
							onChange={(e) => setCommentText(e.target.value)}
							placeholder="Добавьте комментарий..."
							className="flex-1 px-4 py-2.5 rounded-full bg-surface-hover text-[15px] text-theme placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
						/>
						{!commentText.trim() ? (
							<button
								type="button"
								onClick={handleStartRecording}
								disabled={submitting}
								className="p-2 rounded-full text-muted hover:text-brand-primary hover:bg-surface-hover transition-all"
								title="Записать голосовое сообщение"
							>
								<Mic className="w-5 h-5" />
							</button>
						) : (
							<button
								type="submit"
								disabled={submitting}
								className="p-2 rounded-full bg-brand-primary text-white hover:bg-brand-primary-hover transition-all"
							>
								<SendIcon className="w-5 h-5" />
							</button>
						)}
						</div>
					</form>
				)}
			</div>

			<RepostModal
				post={localPost}
				open={repostModalOpen}
				onOpenChange={setRepostModalOpen}
			/>
		</div>
	);
}
