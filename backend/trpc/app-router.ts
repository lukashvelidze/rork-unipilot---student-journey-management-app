import { router } from "./create-context";
import { hiProcedure } from "./routes/example/hi/route";
import { getPostsProcedure } from "./routes/community/get-posts/route";
import { getPostProcedure } from "./routes/community/get-post/route";
import { createPostProcedure } from "./routes/community/create-post/route";
import { likePostProcedure } from "./routes/community/like-post/route";
import { addCommentProcedure } from "./routes/community/add-comment/route";
import { likeCommentProcedure } from "./routes/community/like-comment/route";

export const appRouter = router({
  example: router({
    hi: hiProcedure,
  }),
  community: router({
    getPosts: getPostsProcedure,
    getPost: getPostProcedure,
    createPost: createPostProcedure,
    likePost: likePostProcedure,
    addComment: addCommentProcedure,
    likeComment: likeCommentProcedure,
  }),
});

export type AppRouter = typeof appRouter;