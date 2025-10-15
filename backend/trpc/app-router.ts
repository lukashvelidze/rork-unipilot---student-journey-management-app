import { router } from "./create-context";
import { getPostsProcedure } from "./routes/community/get-posts/route";
import { addCommentProcedure } from "./routes/community/add-comment/route";
import { getResourcesProcedure } from "./routes/premium/get-resources/route";
import { getResourceProcedure } from "./routes/premium/get-resource/route";
import { getSubscriptionProcedure, updateSubscriptionProcedure, cancelSubscriptionProcedure } from "./routes/user/subscription/route";

export const appRouter = router({
  community: router({
    getPosts: getPostsProcedure,
    addComment: addCommentProcedure,
  }),
  premium: router({
    getResources: getResourcesProcedure,
    getResource: getResourceProcedure,
  }),
  user: router({
    getSubscription: getSubscriptionProcedure,
    updateSubscription: updateSubscriptionProcedure,
    cancelSubscription: cancelSubscriptionProcedure,
  }),
});

export type AppRouter = typeof appRouter;


