import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goalType, currentCalories, currentProtein, currentCarbs, currentFats, detailed } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = detailed 
      ? `You are a professional nutritionist providing detailed, personalized advice. Explain the science behind recommendations, provide specific meal examples, and offer practical tips for success. Be comprehensive but conversational.`
      : `You are a professional nutritionist providing brief, actionable nutrition advice. Be concise and focus on the most important recommendations.`;

    const userPrompt = detailed
      ? `I want to ${goalType === 'lose' ? 'lose weight' : goalType === 'maintain' ? 'maintain my weight' : 'gain muscle'}. 
         My current targets are: ${currentCalories} calories, ${currentProtein}g protein, ${currentCarbs}g carbs, ${currentFats}g fats.
         
         Please provide:
         1. Detailed explanation of optimal calorie and macro targets for my goal
         2. Science-based reasoning for these recommendations
         3. Specific meal timing and composition suggestions
         4. Tips for meal planning and preparation
         5. Common pitfalls to avoid
         
         Make it practical and easy to understand.`
      : `I want to ${goalType === 'lose' ? 'lose weight' : goalType === 'maintain' ? 'maintain my weight' : 'gain muscle'}. 
         Current targets: ${currentCalories} cal, ${currentProtein}g protein, ${currentCarbs}g carbs, ${currentFats}g fats.
         
         Provide optimal calorie and macro recommendations with brief reasoning (2-3 sentences max).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const recommendation = data.choices[0].message.content;

    return new Response(JSON.stringify({ recommendation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in goal-recommendations function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
