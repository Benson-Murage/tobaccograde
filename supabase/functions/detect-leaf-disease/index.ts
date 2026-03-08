import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DISEASE_DETECTION_PROMPT = `You are an expert tobacco plant pathologist. Analyze the provided tobacco leaf image for diseases.

DISEASES TO DETECT:
1. Tobacco Mosaic Virus (TMV) - Mosaic pattern of light/dark green, leaf curling, stunted growth
2. Blue Mold (Peronospora tabacina) - Blue-gray fuzzy growth on underside, yellow spots on top
3. Black Shank (Phytophthora nicotianae) - Darkened stem base, wilting, root rot signs
4. Brown Spot (Alternaria alternata) - Circular brown lesions with concentric rings
5. Bacterial Wilt (Ralstonia solanacearum) - Sudden wilting without yellowing
6. Frogeye Leaf Spot - Small circular spots with light centers and dark borders
7. Target Spot (Rhizoctonia solani) - Large irregular brown lesions

RULES:
- Report ALL diseases detected, even multiple
- Provide confidence 0-100 for each
- If no disease detected, report "Healthy" with confidence
- Be conservative: only report >60% confidence findings
- Estimate affected area percentage
- Provide risk level: low/medium/high/critical
- Give actionable recommendations`;

const DISEASE_FUNCTION = {
  type: "function",
  function: {
    name: "detect_diseases",
    description: "Detect tobacco leaf diseases from image analysis",
    parameters: {
      type: "object",
      properties: {
        diseases: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 100 },
              risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
              affected_area_percent: { type: "number", minimum: 0, maximum: 100 },
              symptoms_observed: { type: "string" },
              recommended_action: { type: "string" },
              location_on_leaf: { type: "string" }
            },
            required: ["name", "confidence", "risk_level", "affected_area_percent", "symptoms_observed", "recommended_action"]
          }
        },
        overall_health: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["healthy", "mild_issues", "moderate_issues", "severe_issues", "critical"] },
            score: { type: "number", minimum: 0, maximum: 100 },
            summary: { type: "string" },
            grade_impact: { type: "string", enum: ["none", "minor_downgrade", "significant_downgrade", "reject"] }
          },
          required: ["status", "score", "summary", "grade_impact"]
        },
        batch_recommendation: { type: "string" },
        image_quality_notes: { type: "array", items: { type: "string" } }
      },
      required: ["diseases", "overall_health", "batch_recommendation"]
    }
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { image_base64, image_url, bale_id, grading_id } = await req.json();

    if (!image_base64 && !image_url) {
      return new Response(
        JSON.stringify({ error: "Either image_base64 or image_url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
          { role: "system", content: DISEASE_DETECTION_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this tobacco leaf for diseases. Report all findings with confidence scores." },
              imageContent
            ]
          }
        ],
        tools: [DISEASE_FUNCTION],
        tool_choice: { type: "function", function: { name: "detect_diseases" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded", code: "RATE_LIMITED" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted", code: "CREDITS_DEPLETED" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`Disease detection failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const processingTime = Date.now() - startTime;

    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "detect_diseases") {
      throw new Error("Invalid AI response format");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: { ...analysis, processing_time_ms: processingTime, bale_id, grading_id },
        meta: { timestamp: new Date().toISOString(), processing_time_ms: processingTime },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Disease detection error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Disease detection unavailable. Proceed with visual inspection."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
