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
    const { goalType, calories, protein, carbs, fats } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const goalDescriptions: Record<string, string> = {
      lose: "weight loss (calorie deficit, high protein)",
      maintain: "weight maintenance (balanced macros)",
      gain: "muscle gain (calorie surplus, high protein)"
    };

    const goalDesc = goalDescriptions[goalType] || "balanced nutrition";

    const systemPrompt = `You are a nutritionist AI that suggests healthy recipes. Return exactly 3 recipe suggestions in valid JSON format only. No markdown, no code blocks, just pure JSON.`;

    const userPrompt = `Suggest 3 recipes for someone with a ${goalDesc} goal.
Their daily targets are: ${calories} calories, ${protein}g protein, ${carbs}g carbs, ${fats}g fats.

Each recipe should help them meet their goals. Return a JSON array with this exact structure:
[
  {
    "name": "Recipe Name",
    "description": "Brief description of the recipe",
    "calories": 500,
    "protein": 40,
    "carbs": 45,
    "fats": 15,
    "time": "25 min",
    "difficulty": "Easy"
  }
]

Only return the JSON array, nothing else.`;

    console.log("Calling Lovable AI for recipe suggestions...");

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log("AI response:", content);

    // Parse JSON, handling markdown code blocks
    let jsonString = content.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7);
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.slice(0, -3);
    }
    jsonString = jsonString.trim();

    const recipes = JSON.parse(jsonString);

    return new Response(JSON.stringify({ recipes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in suggest-recipes function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
