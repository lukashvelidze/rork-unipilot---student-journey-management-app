import { publicProcedure } from "../../../create-context";
import { z } from "zod";

export const likePostProcedure = publicProcedure
  .input(
    z.object({
      postId: z.string(),
      isLiked: z.boolean(),
    })
  )
  .mutation(({ input }: { input: any }) => {
    // In a real app, this would update the database
    return {
      postId: input.postId,
      isLiked: input.isLiked,
      likes: input.isLiked ? 1 : -1, // This would be calculated from the database
    };
  });