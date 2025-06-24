import { publicProcedure } from "../../../create-context";
import { z } from "zod";

export const likePostProcedure = publicProcedure
  .input(z.object({
    postId: z.string(),
    isLiked: z.boolean(),
  }))
  .mutation(({ input }: { input: { postId: string; isLiked: boolean } }) => {
    try {
      // In a real app, this would update the database
      console.log(`${input.isLiked ? 'Liked' : 'Unliked'} post ${input.postId}`);
      
      return {
        success: true,
        postId: input.postId,
        isLiked: input.isLiked,
      };
    } catch (error) {
      console.error("Error in likePostProcedure:", error);
      throw new Error("Failed to update like status");
    }
  });