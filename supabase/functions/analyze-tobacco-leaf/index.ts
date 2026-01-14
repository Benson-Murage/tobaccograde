import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tobacco leaf analysis prompt for consistent AI grading
const ANALYSIS_SYSTEM_PROMPT = `You are an expert tobacco leaf quality grading assistant. You analyze tobacco leaf images and provide structured assessments to assist human graders.

IMPORTANT RULES:
1. You are providing SUGGESTIONS only - final decisions are made by human graders
2. Always provide confidence scores (0-100%) for each assessment
3. Be conservative with high confidence scores - only use >90% when very certain
4. Clearly explain your reasoning for each assessment
5. Identify all visible defects and estimate their coverage

GRADING PARAMETERS TO ASSESS:

1. LEAF POSITION (stalk position):
   - lugs: Bottom leaves, usually larger, may have more damage
   - cutters: Middle-lower leaves
   - leaf: Middle leaves, typically best quality
   - tips: Top leaves, smaller, may be over-mature

2. COLOR CLASSIFICATION:
   - lemon: Bright yellow, premium quality indicator
   - orange: Golden-orange, good quality
   - reddish: Red-brown tones, often over-mature
   - brown: Dark brown, indicates quality issues
   - greenish: Underripe, not properly cured

3. MATURITY:
   - under: Leaves appear green-tinged, underdeveloped veins
   - mature: Full development, proper vein structure
   - over: Dark, brittle appearance, over-developed

4. TEXTURE (based on visual assessment):
   - thin: Light, delicate appearance
   - medium: Balanced structure
   - heavy: Thick, substantial appearance

5. DEFECTS TO DETECT:
   - holes: Missing leaf material
   - mold: Fungal growth visible
   - tears: Damaged leaf edges
   - foreign_material: Non-tobacco substances
   - surface_damage: Discoloration, bruising
   - insect_damage: Pest-related damage

6. UNIFORMITY:
   - Assess size variation among visible leaves
   - Assess shape consistency
   - Score 0-100 where 100 is perfectly uniform`;

const ANALYSIS_FUNCTION = {
  type: "function",
  function: {
    name: "analyze_tobacco_leaf",
    description: "Analyze a tobacco leaf image and return structured grading suggestions",
    parameters: {
      type: "object",
      properties: {
        color: {
          type: "object",
          properties: {
            value: { type: "string", enum: ["lemon", "orange", "reddish", "brown", "greenish"] },
            confidence: { type: "number", minimum: 0, maximum: 100 },
            reasoning: { type: "string" }
          },
          required: ["value", "confidence", "reasoning"]
        },
        leaf_position: {
          type: "object",
          properties: {
            value: { type: "string", enum: ["lugs", "cutters", "leaf", "tips"] },
            confidence: { type: "number", minimum: 0, maximum: 100 },
            reasoning: { type: "string" }
          },
          required: ["value", "confidence", "reasoning"]
        },
        maturity: {
          type: "object",
          properties: {
            value: { type: "string", enum: ["under", "mature", "over"] },
            confidence: { type: "number", minimum: 0, maximum: 100 },
            reasoning: { type: "string" }
          },
          required: ["value", "confidence", "reasoning"]
        },
        texture: {
          type: "object",
          properties: {
            value: { type: "string", enum: ["thin", "medium", "heavy"] },
            confidence: { type: "number", minimum: 0, maximum: 100 },
            reasoning: { type: "string" }
          },
          required: ["value", "confidence", "reasoning"]
        },
        defects: {
          type: "object",
          properties: {
            total_percentage: { type: "number", minimum: 0, maximum: 100 },
            confidence: { type: "number", minimum: 0, maximum: 100 },
            detected_issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["holes", "mold", "tears", "foreign_material", "surface_damage", "insect_damage"] },
                  area_percentage: { type: "number" },
                  location: { type: "string" },
                  severity: { type: "string", enum: ["minor", "moderate", "severe"] }
                },
                required: ["type", "area_percentage", "severity"]
              }
            }
          },
          required: ["total_percentage", "confidence", "detected_issues"]
        },
        uniformity: {
          type: "object",
          properties: {
            score: { type: "number", minimum: 0, maximum: 100 },
            size_variation: { type: "number", minimum: 0, maximum: 100 },
            shape_consistency: { type: "number", minimum: 0, maximum: 100 },
            notes: { type: "string" }
          },
          required: ["score", "size_variation", "shape_consistency"]
        },
        suggested_grade: {
          type: "object",
          properties: {
            code: { type: "string" },
            grade_class: { type: "string", enum: ["premium", "good", "standard", "low", "rejected"] },
            confidence: { type: "number", minimum: 0, maximum: 100 },
            reasoning: { type: "string" }
          },
          required: ["code", "grade_class", "confidence", "reasoning"]
        },
        overall_explanation: { type: "string" },
        key_factors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              factor: { type: "string" },
              impact: { type: "string", enum: ["positive", "negative", "neutral"] },
              importance: { type: "string", enum: ["high", "medium", "low"] }
            },
            required: ["factor", "impact", "importance"]
          }
        },
        image_quality_issues: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["color", "leaf_position", "maturity", "texture", "defects", "uniformity", "suggested_grade", "overall_explanation", "key_factors"]
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
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare image content for API
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
        model: "google/gemini-2.5-pro", // Best for vision + complex reasoning
        messages: [
          { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
          { 
            role: "user", 
            content: [
              { type: "text", text: "Analyze this tobacco leaf image and provide detailed grading suggestions. Be thorough in your assessment." },
              imageContent
            ]
          }
        ],
        tools: [ANALYSIS_FUNCTION],
        tool_choice: { type: "function", function: { name: "analyze_tobacco_leaf" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment.", code: "RATE_LIMITED" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue.", code: "CREDITS_DEPLETED" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const processingTime = Date.now() - startTime;

    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "analyze_tobacco_leaf") {
      throw new Error("Invalid AI response format");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Return structured response
    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          ...analysis,
          processing_time_ms: processingTime,
          model_used: "google/gemini-2.5-pro",
          bale_id,
          grading_id,
        },
        meta: {
          timestamp: new Date().toISOString(),
          processing_time_ms: processingTime,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        fallback_available: true,
        message: "AI analysis unavailable. Please proceed with manual grading."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});