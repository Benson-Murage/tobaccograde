import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, period_start, period_end } = await req.json();

    if (!company_id) {
      return new Response(
        JSON.stringify({ error: "company_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Default to last 30 days if not specified
    const startDate = period_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = period_end || new Date().toISOString().split('T')[0];

    // Get all grader decisions in the period
    const { data: decisions, error: decisionsError } = await supabase
      .from("ai_grader_decisions")
      .select(`
        *,
        ai_predictions (
          suggested_grade,
          suggested_grade_class,
          overall_confidence
        )
      `)
      .eq("company_id", company_id)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (decisionsError) throw decisionsError;

    // Get all gradings in the period
    const { data: gradings, error: gradingsError } = await supabase
      .from("gradings")
      .select("*")
      .eq("company_id", company_id)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (gradingsError) throw gradingsError;

    // Group by grader
    const graderMap = new Map<string, {
      decisions: typeof decisions,
      gradings: typeof gradings,
      totalGradings: number,
      aiAssisted: number,
      accepts: number,
      modifies: number,
      rejects: number,
      gradeDistribution: Record<string, number>,
      deviations: number[],
    }>();

    // Process decisions
    for (const decision of decisions || []) {
      const graderId = decision.grader_id;
      if (!graderMap.has(graderId)) {
        graderMap.set(graderId, {
          decisions: [],
          gradings: [],
          totalGradings: 0,
          aiAssisted: 0,
          accepts: 0,
          modifies: 0,
          rejects: 0,
          gradeDistribution: {},
          deviations: [],
        });
      }
      
      const stats = graderMap.get(graderId)!;
      stats.decisions.push(decision);
      stats.aiAssisted++;

      // Count decision types
      if (decision.overall_decision === 'accept' || decision.overall_decision === 'accept_all') {
        stats.accepts++;
      } else if (decision.overall_decision === 'reject' || decision.overall_decision === 'reject_all') {
        stats.rejects++;
      } else {
        stats.modifies++;
      }

      // Track grade distribution
      const grade = decision.final_grade;
      stats.gradeDistribution[grade] = (stats.gradeDistribution[grade] || 0) + 1;

      // Calculate deviation from AI
      if (decision.ai_suggested_grade && decision.final_grade && decision.ai_suggested_grade !== decision.final_grade) {
        stats.deviations.push(1); // Simple binary deviation tracking
      } else {
        stats.deviations.push(0);
      }
    }

    // Add non-AI gradings to totals
    for (const grading of gradings || []) {
      const graderId = grading.graded_by;
      if (!graderId) continue;

      if (!graderMap.has(graderId)) {
        graderMap.set(graderId, {
          decisions: [],
          gradings: [],
          totalGradings: 0,
          aiAssisted: 0,
          accepts: 0,
          modifies: 0,
          rejects: 0,
          gradeDistribution: {},
          deviations: [],
        });
      }
      
      const stats = graderMap.get(graderId)!;
      stats.totalGradings++;
      stats.gradings.push(grading);
    }

    // Calculate analytics for each grader
    const analytics = [];
    const allHarshness: number[] = [];

    for (const [graderId, stats] of graderMap) {
      const totalDecisions = stats.aiAssisted;
      
      const acceptRate = totalDecisions > 0 ? (stats.accepts / totalDecisions) * 100 : null;
      const modifyRate = totalDecisions > 0 ? (stats.modifies / totalDecisions) * 100 : null;
      const rejectRate = totalDecisions > 0 ? (stats.rejects / totalDecisions) * 100 : null;

      const avgDeviation = stats.deviations.length > 0 
        ? stats.deviations.reduce((a, b) => a + b, 0) / stats.deviations.length * 100
        : null;

      // Calculate harshness score (simplified: based on deviation from AI)
      // Negative = lenient (upgrades from AI), Positive = harsh (downgrades from AI)
      const harshness = avgDeviation !== null ? (avgDeviation - 50) / 50 * 100 : 0;
      allHarshness.push(harshness);

      // Consistency score (inverse of deviation variance)
      const deviationVariance = stats.deviations.length > 1
        ? stats.deviations.reduce((sum, d) => sum + Math.pow(d - (avgDeviation || 0) / 100, 2), 0) / stats.deviations.length
        : 0;
      const consistencyScore = Math.max(0, 100 - deviationVariance * 100);

      // Risk score calculation
      let riskScore = 0;
      const riskFactors = [];

      if (rejectRate !== null && rejectRate > 50) {
        riskScore += 30;
        riskFactors.push({ factor: "High AI rejection rate", severity: "high" });
      }
      if (avgDeviation !== null && avgDeviation > 40) {
        riskScore += 25;
        riskFactors.push({ factor: "High deviation from AI suggestions", severity: "medium" });
      }
      if (consistencyScore < 60) {
        riskScore += 20;
        riskFactors.push({ factor: "Inconsistent grading patterns", severity: "medium" });
      }

      analytics.push({
        grader_id: graderId,
        company_id,
        period_start: startDate,
        period_end: endDate,
        total_gradings: stats.totalGradings,
        total_with_ai_assist: stats.aiAssisted,
        ai_accept_rate: acceptRate,
        ai_modify_rate: modifyRate,
        ai_reject_rate: rejectRate,
        grade_distribution: stats.gradeDistribution,
        avg_deviation_from_ai: avgDeviation,
        deviation_trend: "stable", // Would need historical data to calculate
        harshness_score: harshness,
        harshness_percentile: 50, // Will be calculated after all graders processed
        consistency_score: consistencyScore,
        pattern_anomalies: [],
        risk_score: Math.min(100, riskScore),
        risk_factors: riskFactors,
        requires_review: riskScore >= 50,
      });
    }

    // Calculate harshness percentiles
    const sortedHarshness = [...allHarshness].sort((a, b) => a - b);
    for (const record of analytics) {
      const percentile = sortedHarshness.findIndex(h => h >= record.harshness_score) / sortedHarshness.length * 100;
      record.harshness_percentile = Math.round(percentile);
    }

    // Upsert analytics records
    for (const record of analytics) {
      const { error } = await supabase
        .from("grader_analytics")
        .upsert(record, { 
          onConflict: "company_id,grader_id,period_start,period_end" 
        });

      if (error) {
        console.error("Error upserting analytics:", error);
      }
    }

    // Generate fraud alerts for high-risk graders
    for (const record of analytics) {
      if (record.requires_review) {
        const { error } = await supabase
          .from("fraud_alerts")
          .insert({
            company_id,
            grader_id: record.grader_id,
            alert_type: "pattern_anomaly",
            severity: record.risk_score >= 75 ? "high" : "medium",
            title: `Grading pattern anomaly detected`,
            description: `Risk score of ${record.risk_score}% detected for grader during period ${startDate} to ${endDate}`,
            evidence: record.risk_factors,
          });

        if (error && !error.message.includes("duplicate")) {
          console.error("Error creating alert:", error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analytics_count: analytics.length,
        period: { start: startDate, end: endDate },
        summary: {
          total_graders: analytics.length,
          high_risk_graders: analytics.filter(a => a.risk_score >= 50).length,
          avg_ai_acceptance_rate: analytics.reduce((sum, a) => sum + (a.ai_accept_rate || 0), 0) / analytics.length,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Analytics calculation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});