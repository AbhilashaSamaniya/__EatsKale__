import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useActivityTracking = () => {
  useEffect(() => {
    trackDailyLogin();
  }, []);

  const trackDailyLogin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    // Try to insert or update activity
    const { error } = await supabase
      .from("user_activity")
      .upsert({
        user_id: user.id,
        activity_date: today,
        login_count: 1,
      }, {
        onConflict: 'user_id,activity_date',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("Error tracking activity:", error);
    }
  };
};