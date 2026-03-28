import { useCallback, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { configureRevenueCat } from "@/lib/iap";

type SyncState = {
  lastUserId: string | null;
  inFlight: Promise<void> | null;
};

export const useRevenueCatSync = () => {
  const stateRef = useRef<SyncState>({ lastUserId: null, inFlight: null });

  const syncForUser = useCallback(async (user?: User | null) => {
    if (!user?.id) {
      stateRef.current.lastUserId = null;
      return;
    }

    if (stateRef.current.lastUserId === user.id) {
      return;
    }

    if (stateRef.current.inFlight) {
      await stateRef.current.inFlight.catch(() => undefined);
      if (stateRef.current.lastUserId === user.id) {
        return;
      }
    }

    const run = (async () => {
      try {
        await configureRevenueCat(user.id);

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("revenuecat_app_user_id")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("RevenueCat sync: failed to load profile", error);
          return;
        }

        if (profile?.revenuecat_app_user_id !== user.id) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              revenuecat_app_user_id: user.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (updateError) {
            console.error("RevenueCat sync: failed to update profile", updateError);
            return;
          }
        }

        stateRef.current.lastUserId = user.id;
      } catch (error) {
        console.error("RevenueCat sync: unexpected error", error);
      } finally {
        stateRef.current.inFlight = null;
      }
    })();

    stateRef.current.inFlight = run;
    await run;
  }, []);

  return { syncForUser };
};
