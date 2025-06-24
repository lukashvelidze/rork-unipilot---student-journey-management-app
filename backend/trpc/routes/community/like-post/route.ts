import { publicProcedure } from "../../../create-context";
import { z } from "zod";

export const likePostProcedure = publicProcedure
  .input(z.object({
    postId: z.string(),
    isLiked: z.boolean(),
  }))
  .mutation(({ input }: { input: { postId: string; isLiked: boolean } }) => {
    // In a real app, this would update the database
    return {
      success: true,
      postId: input.postId,
      isLiked: input.isLiked,
    };
  });