import { useState, useEffect } from "react";
import { Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const DailyQuote = () => {
  const [quote, setQuote] = useState<{ quote: string; author: string | null } | null>(null);

  useEffect(() => {
    fetchDailyQuote();
  }, []);

  const fetchDailyQuote = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from("daily_quotes")
      .select("quote, author")
      .eq("date", today)
      .maybeSingle();

    if (error) {
      console.error("Error fetching quote:", error);
      return;
    }

    if (!data) {
      // If no quote for today, get a random one
      const { data: randomQuote } = await supabase
        .from("daily_quotes")
        .select("quote, author")
        .limit(1)
        .maybeSingle();
      
      setQuote(randomQuote);
    } else {
      setQuote(data);
    }
  };

  if (!quote) return null;

  return (
    <div className="bg-gradient-accent text-white rounded-lg p-6 shadow-elegant">
      <div className="flex items-start gap-3">
        <Quote className="h-6 w-6 flex-shrink-0 mt-1 opacity-80" />
        <div>
          <p className="text-lg font-medium leading-relaxed mb-2">{quote.quote}</p>
          {quote.author && (
            <p className="text-sm opacity-90">— {quote.author}</p>
          )}
        </div>
      </div>
    </div>
  );
};