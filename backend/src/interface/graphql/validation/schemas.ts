import { z } from "zod";

export const registerInputSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  displayName: z.string().max(100).optional(),
});

export const loginInputSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileInputSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
});

export const createPostInputSchema = z.object({
  content: z
    .string()
    .max(280, "Post content must be at most 280 characters"),
});

export const updatePostInputSchema = z.object({
  id: z.string().uuid("Invalid post ID"),
  content: z
    .string()
    .min(1, "Post content cannot be empty")
    .max(280, "Post content must be at most 280 characters"),
});

export const createCommentInputSchema = z.object({
  postId: z.string().uuid("Invalid post ID"),
  content: z
    .string()
    .min(1, "Comment content cannot be empty")
    .max(500, "Comment content must be at most 500 characters"),
});

export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
export type CreatePostInput = z.infer<typeof createPostInputSchema>;
export type UpdatePostInput = z.infer<typeof updatePostInputSchema>;
export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
