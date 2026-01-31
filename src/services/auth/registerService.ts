
import { supabase } from "@/integrations/supabase/client";
import { User } from "../api";
import { showToast } from "./utils";
import { login } from "./loginService";
import { trackUserEvent } from "@/services/analytics/googleAnalytics";

export const register = async (name: string, email: string, password: string) => {
  try {
    // Register user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          username: email.split('@')[0],
        }
      }
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Failed to create user account");
    }

    // Track successful signup
    trackUserEvent.signup('email');

    // Email verification required - do NOT auto-login
    showToast(
      "Registration successful",
      "Please check your email to verify your account before logging in"
    );

    // Return user data with the correct role type
    return {
      id: authData.user.id,
      name: name,
      email: email,
      role: 'user' as 'user' | 'expert', // Ensure role is correctly typed
      followers: 0,
      following: 0,
      joined: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  } catch (error) {
    console.error("Registration error:", error);
    showToast(
      "Registration failed",
      error instanceof Error ? error.message : "Something went wrong",
      "destructive"
    );
    return null;
  }
};
