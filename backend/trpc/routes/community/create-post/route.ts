import { publicProcedure } from "../../create-context";
import { z } from "zod";

const topicSchema = z.enum([
  "visa",
  "university", 
  "accommodation",
  "finances",
  "culture",
  "academics",
  "career",
  "general"
]);

export const createPostProcedure = publicProcedure
  .input(
    z.object({
      title: z.string().min(1, "Title is required"),
      content: z.string().min(1, "Content is required"),
      topic: topicSchema,
      userId: z.string().default("current_user"),
      userName: z.string().default("Anonymous User"),
      userAvatar: z.string().optional(),
      isPremium: z.boolean().default(false),
    })
  )
  .mutation(({ input }) => {
    // In a real app, this would save to a database
    const newPost = {
      id: `post_${Date.now()}`,
      userId: input.userId,
      userName: input.userName,
      userAvatar: input.userAvatar,
      title: input.title,
      content: input.content,
      topic: input.topic,
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      isPremium: input.isPremium,
      comments: [],
    };
    
    return newPost;
  });