import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "../supabase/client";

const lovableAuth = createLovableAuth({});

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple", opts?: { redirect_uri?: string }) => {
      const result = await lovableAuth.signInWithOAuth(provider, { ...opts });
      if (result.redirected || result.error) return result;
      if (supabase && result.tokens) {
        try {
          await supabase.auth.setSession(result.tokens);
        } catch (e) {
          return { error: e instanceof Error ? e : new Error(String(e)) };
        }
      }
      return result;
    },
  },
};
