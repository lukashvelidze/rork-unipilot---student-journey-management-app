import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getPostsProcedure } from "./routes/community/get-posts/route";
import { getPostProcedure } from "./routes/community/get-post/route";
import { createPostProcedure } from "./routes/community/create-post/route";
import { addCommentProcedure } from "./routes/community/add-comment/route";
import { likePostProcedure } from "./routes/community/like-post/route";
import { likeCommentProcedure } from "./routes/community/like-comment/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  community: createTRPCRouter({
    getPosts: getPostsProcedure,
    getPost: getPostProcedure,
    createPost: createPostProcedure,
    addComment: addCommentProcedure,
    likePost: likePostProcedure,
    likeComment: likeCommentProcedure,
  }),
});

export type AppRouter = typeof appRouter;