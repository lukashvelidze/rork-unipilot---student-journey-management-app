import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const hiProcedure = publicProcedure
  .input(z.object({ name: z.string().optional().default("world") }))
  .query(({ input }) => {
    return {
      hello: input.name,
      date: new Date(),
    };
  });

export default hiProcedure;