import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { motion } from 'framer-motion';
import { Avatar, VerifiedBadge, HeartIcon, Spinner, AudioPlayer } from '@shared/ui';
import { formatTimeAgo, parseContent } from '@shared/lib';
import { COMMENT_REPLIES_QUERY, LIKE_COMMENT_MUTATION, UNLIKE_COMMENT_MUTATION } from '@shared/api/graphql/comments';
import { UserHoverCard } from '@features/user/user-hover-card';
import type { Comment } from '@entities/comment';

const ease = [0.22, 1, 0.36, 1] as const;

interface CommentItemProps {
	comment: Comment;
	index: number;
	onReply: (commentId: string, authorName: string, mentionUsername?: string) => void;
	isReply?: boolean;
	rootCommentId?: string;
	expandedReplies?: Set<string>;
	setExpandedReplies?: React.Dispatch<React.SetStateAction<Set<string>>>;
	onLinkClick?: () => void;
}

export function CommentItem({ comment, index, onReply, isReply = false, rootCommentId, expandedReplies, setExpandedReplies, onLinkClick }: CommentItemProps) {
	console.log('CommentItem - comment:', comment.id, 'audioUrl:', comment.audioUrl, 'content:', comment.content);
	const [isLiked, setIsLiked] = useState(comment.isLiked);
	const [likesCount, setLikesCount] = useState(comment.likesCount);

	const shouldShowFirstReply = !isReply && comment.repliesCount > 0;
	const showAllReplies = expandedReplies?.has(comment.id) ?? false;

	const showReplies = shouldShowFirstReply || showAllReplies;

	const setShowAllReplies = (show: boolean) => {
		if (setExpandedReplies) {
			setExpandedReplies(prev => {
				const next = new Set(prev);
				if (show) {
					next.add(comment.id);
				} else {
					next.delete(comment.id);
				}
				return next;
			});
		}
	};

	const [likeComment] = useMutation(LIKE_COMMENT_MUTATION);
	const [unlikeComment] = useMutation(UNLIKE_COMMENT_MUTATION);

	const { data: repliesData, loading: repliesLoading } = useQuery(COMMENT_REPLIES_QUERY, {
		variables: { commentId: comment.id, limit: 20, offset: 0 },
		skip: !showReplies || isReply,
	});

	const replies: Comment[] = (repliesData?.commentReplies as Comment[]) || [];
	const firstReply = replies.length > 0 ? replies[0] : null;
	const otherReplies = replies.length > 1 ? replies.slice(1) : [];

	const handleLike = async () => {
		const wasLiked = isLiked;
		setIsLiked(!wasLiked);
		setLikesCount(wasLiked ? likesCount - 1 : likesCount + 1);

		try {
			if (wasLiked) {
				await unlikeComment({ variables: { commentId: comment.id } });
			} else {
				await likeComment({ variables: { commentId: comment.id } });
			}
		} catch {
			setIsLiked(wasLiked);
			setLikesCount(comment.likesCount);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ delay: index * 0.02, duration: 0.2, ease }}
			className={`${isReply ? 'p-1 pl-14 bg-surface-hover/30' : 'p-4'}`}
		>
			<div className="flex gap-3">
				<UserHoverCard userId={comment.author.id}>
					<NavLink to={`/${comment.author.username}`} className="flex-shrink-0" onClick={onLinkClick}>
						<Avatar
							emoji={comment.author.emoji}
							src={comment.author.avatarUrl}
							alt={comment.author.displayName}
							size={isReply ? 'xs' : 'sm'}
						/>
					</NavLink>
				</UserHoverCard>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<UserHoverCard userId={comment.author.id}>
							<NavLink
								to={`/${comment.author.username}`}
								className="font-semibold text-theme text-sm hover:underline"
								onClick={onLinkClick}
							>
								{comment.author.displayName}
							</NavLink>
						</UserHoverCard>
						{comment.author.verified && (
							<VerifiedBadge className="w-3.5 h-3.5 text-brand-primary" />
						)}
						<span className="text-xs text-muted">{formatTimeAgo(comment.createdAt)}</span>
					</div>

					{comment.audioUrl && comment.audioUrl.trim() !== '' ? (
						<div className="mt-2">
							<AudioPlayer audioUrl={comment.audioUrl} duration={comment.audioDuration || undefined} />
						</div>
					) : comment.content ? (
						<p className="text-theme text-sm mt-1 whitespace-pre-wrap break-words leading-relaxed">
							{parseContent(comment.content)}
						</p>
					) : null}

					<div className="flex items-center gap-4 mt-2">
						<button
							onClick={handleLike}
							className={`flex items-center gap-1 text-xs transition-colors ${isLiked ? 'text-red-500' : 'text-muted hover:text-red-500'
								}`}
						>
							<HeartIcon filled={isLiked} className="w-4 h-4" />
							{likesCount > 0 && <span>{likesCount}</span>}
						</button>
						<button
							onClick={() => {
								if (isReply && rootCommentId) {

									onReply(rootCommentId, comment.author.displayName, comment.author.username);
								} else {

									onReply(comment.id, comment.author.displayName);
								}
							}}
							className="text-xs text-muted hover:text-theme transition-colors"
						>
							Ответить
						</button>
					</div>
				</div>
			</div>

			
			{showReplies && !isReply && (
				<div className="mt-2 -mx-4">
					{repliesLoading ? (
						<div className="flex justify-center py-4">
							<Spinner size="xs" />
						</div>
					) : (
						<>
							
							{firstReply && (
								<CommentItem
									key={firstReply.id}
									comment={firstReply}
									index={0}
									onReply={onReply}
									isReply
									rootCommentId={comment.id}
									onLinkClick={onLinkClick}
								/>
							)}

							
							{showAllReplies && otherReplies.map((reply, replyIndex) => (
								<CommentItem
									key={reply.id}
									comment={reply}
									index={replyIndex + 1}
									onReply={onReply}
									isReply
									rootCommentId={comment.id}
									onLinkClick={onLinkClick}
								/>
							))}
						</>
					)}
				</div>
			)}

			
			{!isReply && comment.repliesCount > 1 && (
				<button
					onClick={() => setShowAllReplies(!showAllReplies)}
					className="ml-11 mt-3 text-xs text-brand-primary hover:underline font-medium"
				>
					{showAllReplies
						? 'Скрыть ответы'
						: `Показать еще ${comment.repliesCount - 1} ${comment.repliesCount - 1 === 1 ? 'ответ' : comment.repliesCount - 1 < 5 ? 'ответа' : 'ответов'}`}
				</button>
			)}
		</motion.div>
	);
}
