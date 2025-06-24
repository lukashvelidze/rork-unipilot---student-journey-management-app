import { publicProcedure } from "../../create-context";
import { z } from "zod";

export const addCommentProcedure = publicProcedure
  .input(
    z.object({
      postId: z.string(),
      content: z.string().min(1, "Comment content is required"),
      userId: z.string().default("current_user"),
      userName: z.string().default("Anonymous User"),
      userAvatar: z.string().optional(),
      isPremium: z.boolean().default(false),
    })
  )
  .mutation(({ input }) => {
    // In a real app, this would save to a database
    const newComment = {
      id: `comment_${Date.now()}`,
      userId: input.userId,
      userName: input.userName,
      userAvatar: input.userAvatar,
      content: input.content,
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      isPremium: input.isPremium,
    };
    
    return newComment;
  });