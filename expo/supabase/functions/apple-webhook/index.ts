import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  try {
    const body = await req.json();
    console.log("Apple notification received:", body?.notificationType || "UNKNOWN");
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Apple webhook error:", err);
    return new Response("OK", { status: 200 });
  }
});

