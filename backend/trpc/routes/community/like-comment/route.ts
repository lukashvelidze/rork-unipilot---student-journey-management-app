import { publicProcedure } from "../../../create-context";
import { z } from "zod";

export const likeCommentProcedure = publicProcedure
  .input(z.object({
    postId: z.string(),
    commentId: z.string(),
    isLiked: z.boolean(),
  }))
  .mutation(({ input }: { input: { postId: string; commentId: string; isLiked: boolean } }) => {
    // In a real app, this would update the database
    return {
      success: true,
      postId: input.postId,
      commentId: input.commentId,
      isLiked: input.isLiked,
    };
  });