import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HARVEST_PREDICTION_PROMPT = `You are an expert tobacco agronomist. Analyze field photos of growing tobacco to predict leaf quality before harvest.

PREDICT:
1. Expected grade (A/B/C/Reject) with confidence
2. Estimated yield per hectare
3. Expected market value guidance
4. Optimal harvest timing
5. Growth stage assessment
6. Potential issues that could affect grade

Be conservative with predictions. Field conditions differ from cured leaf quality.`;

const PREDICTION_FUNCTION = {
  type: "function",
  function: {
    name: "predict_harvest",
    description: "Predict tobacco harvest quality from field images",
    parameters: {
      type: "object",
      properties: {
        predicted_grade: {
          type: "object",
          properties: {
            grade: { type: "string", enum: ["A", "B", "C", "Reject"] },
            grade_class: { type: "string", enum: ["premium", "good", "standard", "low", "rejected"] },
            confidence: { type: "number", minimum: 0, maximum: 100 },
            reasoning: { type: "string" }
          },
          required: ["grade", "grade_class", "confidence", "reasoning"]
        },
        yield_estimate: {
          type: "object",
          properties: {
            kg_per_hectare: { type: "number" },
            confidence: { type: "number", minimum: 0, maximum: 100 },
            notes: { type: "string" }
          },
          required: ["kg_per_hectare", "confidence"]
        },
        growth_stage: {
          type: "object",
          properties: {
            stage: { type: "string", enum: ["seedling", "vegetative", "topping", "ripening", "ready_to_harvest", "over_mature"] },
            days_to_harvest: { type: "number" },
            notes: { type: "string" }
          },
          required: ["stage", "days_to_harvest"]
        },
        potential_issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              issue: { type: "string" },
              severity: { type: "string", enum: ["low", "medium", "high"] },
              recommendation: { type: "string" }
            },
            required: ["issue", "severity", "recommendation"]
          }
        },
        harvest_recommendation: { type: "string" },
        value_estimate: {
          type: "object",
          properties: {
            usd_per_kg: { type: "number" },
            total_estimate_per_hectare: { type: "number" },
            notes: { type: "string" }
          },
          required: ["usd_per_kg", "total_estimate_per_hectare"]
        }
      },
      required: ["predicted_grade", "yield_estimate", "growth_stage", "potential_issues", "harvest_recommendation", "value_estimate"]
    }
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const { image_base64, image_url, farmer_id } = await req.json();

    if (!image_base64 && !image_url) {
      return new Response(JSON.stringify({ error: "Image required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const imageContent = image_base64
      ? { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image_base64}` } }
      : { type: "image_url", image_url: { url: image_url } };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: HARVEST_PREDICTION_PROMPT },
          { role: "user", content: [
            { type: "text", text: "Analyze this tobacco field image and predict harvest quality, yield, and timing." },
            imageContent
          ]}
        ],
        tools: [PREDICTION_FUNCTION],
        tool_choice: { type: "function", function: { name: "predict_harvest" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited", code: "RATE_LIMITED" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits depleted", code: "CREDITS_DEPLETED" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`Prediction failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const processingTime = Date.now() - startTime;
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Invalid AI response");

    const prediction = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      success: true,
      prediction: { ...prediction, processing_time_ms: processingTime, farmer_id },
      meta: { timestamp: new Date().toISOString(), processing_time_ms: processingTime },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Harvest prediction error:", error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : "Unknown error",
      message: "Prediction unavailable."
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
