/**
 * AI-Assisted Tobacco Grading Page
 * 
 * Hardware-first workflow with human-in-the-loop AI grading.
 * Manual entry only when devices unavailable.
 */

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AIAnalysisPanel, type AISuggestion, type AIDecision, type Decision } from "@/components/grading/AIAnalysisPanel";
import { PriceBreakdownCard } from "@/components/grading/PriceBreakdownCard";
import { ImageCaptureGuidance, type CaptureMetadata } from "@/components/grading/ImageCaptureGuidance";
import { HardwareGradingWorkflow } from "@/components/hardware/HardwareGradingWorkflow";
import { AuditRiskBadge } from "@/components/hardware/AuditRiskBadge";
import { type DeviceReading } from "@/lib/hardware-devices";
import { submitGrading, type GradingSubmission } from "@/lib/grading-submission";
import {
  LEAF_POSITIONS,
  TOBACCO_COLORS,
  TOBACCO_TEXTURES,
  TOBACCO_MATURITY,
  generateGradeCode,
  validateMoisture,
  calculateTobaccoPrice,
  checkGradeEligibility,
  type LeafPosition,
  type TobaccoColor,
  type TobaccoTexture,
  type TobaccoMaturity,
  type QualityBand,
} from "@/lib/tobacco-grading";
import {
  Search,
  Scan,
  Camera,
  CheckCircle,
  ChevronRight,
  Package,
  User,
  Scale,
  Droplets,
  Leaf,
  AlertTriangle,
  Brain,
  X,
  Bluetooth,
  Pencil,
  Loader2,
} from "lucide-react";

// Workflow step type
type WorkflowStep = 'hardware' | 'grading';

// No mock data - bale info comes from hardware workflow

export default function GradingPage() {
  const navigate = useNavigate();
  const { companyId } = useAuth();
  
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('hardware');
  const [searchQuery, setSearchQuery] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Current bale data from hardware workflow
  const [currentBaleData, setCurrentBaleData] = useState<{
    id: string;
    code: string;
    farmerName: string;
    farmerId: string;
    warehouseId: string;
  } | null>(null);
  
  // Hardware workflow data
  const [hardwareWeight, setHardwareWeight] = useState<DeviceReading<number> | null>(null);
  const [hardwareMoisture, setHardwareMoisture] = useState<DeviceReading<number> | null>(null);
  const [auditRiskScore, setAuditRiskScore] = useState<number>(0);
  const [requiresSupervisorApproval, setRequiresSupervisorApproval] = useState(false);
  
  // AI suggestions and decisions
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [aiDecisions, setAiDecisions] = useState<Record<string, AIDecision>>({});
  const [processingTimeMs, setProcessingTimeMs] = useState<number | undefined>();
  const [overallConfidence, setOverallConfidence] = useState<number | undefined>();
  const [aiExplanation, setAiExplanation] = useState<string | undefined>();

  // Manual selections (used when AI rejected or for manual grading)
  const [position, setPosition] = useState<LeafPosition | null>(null);
  const [color, setColor] = useState<TobaccoColor | null>(null);
  const [texture, setTexture] = useState<TobaccoTexture | null>(null);
  const [maturity, setMaturity] = useState<TobaccoMaturity | null>(null);
  const [moisturePercent, setMoisturePercent] = useState<number | null>(null);
  const [defectPercent, setDefectPercent] = useState<number | null>(null);


  // Handle AI decision
  const handleAIDecision = useCallback((attribute: string, decision: Decision, finalValue?: string) => {
    const suggestion = aiSuggestions.find(s => s.attribute === attribute);
    if (!suggestion) return;

    setAiDecisions(prev => ({
      ...prev,
      [attribute]: {
        attribute,
        decision,
        aiValue: suggestion.aiValue,
        finalValue: finalValue || suggestion.aiValue,
      }
    }));

    // Apply to manual selections if accepted
    if (decision === 'accept' && finalValue) {
      switch (attribute) {
        case 'color': setColor(finalValue as TobaccoColor); break;
        case 'leaf_position': setPosition(finalValue as LeafPosition); break;
        case 'texture': setTexture(finalValue as TobaccoTexture); break;
        case 'maturity': setMaturity(finalValue as TobaccoMaturity); break;
      }
    }
  }, [aiSuggestions]);

  // Handle image capture
  const handleImageCapture = async (imageData: string, metadata: CaptureMetadata) => {
    setCapturedImage(imageData);
    setShowCamera(false);
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-tobacco-leaf', {
        body: {
          image_base64: imageData.split(',')[1],
          bale_id: currentBaleData?.id || '',
        }
      });

      if (error) throw error;

      if (data.success && data.analysis) {
        const analysis = data.analysis;
        
        // Build suggestions from AI response
        const suggestions: AISuggestion[] = [];
        
        if (analysis.color) {
          suggestions.push({
            attribute: 'color',
            aiValue: analysis.color.value,
            aiLabel: TOBACCO_COLORS[analysis.color.value as TobaccoColor]?.label || analysis.color.value,
            confidence: analysis.color.confidence,
            reasoning: analysis.color.reasoning,
          });
        }
        
        if (analysis.leaf_position) {
          suggestions.push({
            attribute: 'leaf_position',
            aiValue: analysis.leaf_position.value,
            aiLabel: LEAF_POSITIONS[analysis.leaf_position.value as LeafPosition]?.label || analysis.leaf_position.value,
            confidence: analysis.leaf_position.confidence,
            reasoning: analysis.leaf_position.reasoning,
          });
        }

        if (analysis.texture) {
          suggestions.push({
            attribute: 'texture',
            aiValue: analysis.texture.value,
            aiLabel: TOBACCO_TEXTURES[analysis.texture.value as TobaccoTexture]?.label || analysis.texture.value,
            confidence: analysis.texture.confidence,
            reasoning: analysis.texture.reasoning,
          });
        }

        if (analysis.maturity) {
          suggestions.push({
            attribute: 'maturity',
            aiValue: analysis.maturity.value,
            aiLabel: analysis.maturity.value,
            confidence: analysis.maturity.confidence,
            reasoning: analysis.maturity.reasoning,
          });
        }

        setAiSuggestions(suggestions);
        setProcessingTimeMs(analysis.processing_time_ms);
        setOverallConfidence(analysis.suggested_grade?.confidence);
        setAiExplanation(analysis.overall_explanation);

        // Initialize all as pending
        const initialDecisions: Record<string, AIDecision> = {};
        suggestions.forEach(s => {
          initialDecisions[s.attribute] = {
            attribute: s.attribute,
            decision: 'pending',
            aiValue: s.aiValue,
            finalValue: s.aiValue,
          };
        });
        setAiDecisions(initialDecisions);

        // Set defect from AI
        if (analysis.defects) {
          setDefectPercent(analysis.defects.total_percentage);
        }

        toast.success("AI analysis complete", {
          description: "Review suggestions and confirm each attribute"
        });
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error("AI analysis unavailable", {
        description: "Proceeding with manual grading"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate grade based on current selections
  const gradeResult = useMemo(() => {
    if (!position || !color || !texture || !maturity || moisturePercent === null || defectPercent === null) {
      return null;
    }

    const eligibility = checkGradeEligibility({
      position, color, texture, maturity, moisturePercent, defectPercent
    });

    if (!eligibility.eligible) {
      return { grade: 'REJ', class: 'rejected' as const, eligibility };
    }

    const gradeCode = generateGradeCode(position, eligibility.suggestedQualityBand, color);
    return { grade: gradeCode.fullCode, class: eligibility.suggestedClass, eligibility };
  }, [position, color, texture, maturity, moisturePercent, defectPercent]);

  // Calculate price breakdown
  const priceBreakdown = useMemo(() => {
    if (!position || !color || !texture || !gradeResult || moisturePercent === null || defectPercent === null) {
      return null;
    }

    return calculateTobaccoPrice({
      basePrice: 4.50,
      position,
      color,
      texture,
      qualityBand: gradeResult.eligibility?.suggestedQualityBand || 2,
      moisturePercent,
      defectPercent,
      weightKg: hardwareWeight?.value || 0,
    });
  }, [position, color, texture, gradeResult, moisturePercent, defectPercent]);

  const gradeClassColors = {
    premium: "bg-success text-success-foreground",
    good: "bg-primary text-primary-foreground",
    standard: "bg-secondary text-secondary-foreground",
    low: "bg-warning text-warning-foreground",
    rejected: "bg-destructive text-destructive-foreground",
  };

  // Handle hardware workflow completion
  const handleHardwareComplete = (data: {
    bale: { id: string; code: string; farmerName: string; farmerId: string; warehouseId?: string };
    weight: DeviceReading<number>;
    moisture: DeviceReading<number>;
    riskScore: number;
    requiresSupervisorApproval: boolean;
  }) => {
    setCurrentBaleData({
      id: data.bale.id,
      code: data.bale.code,
      farmerName: data.bale.farmerName,
      farmerId: data.bale.farmerId,
      warehouseId: data.bale.warehouseId || 'default-warehouse',
    });
    setHardwareWeight(data.weight);
    setHardwareMoisture(data.moisture);
    setMoisturePercent(data.moisture.value);
    setAuditRiskScore(data.riskScore);
    setRequiresSupervisorApproval(data.requiresSupervisorApproval);
    setWorkflowStep('grading');
    toast.success("Hardware capture complete", {
      description: "Proceed to image capture and grading"
    });
  };

  // Handle grading submission
  const handleConfirmGrade = async () => {
    if (!gradeResult || !position || !color || !texture || !maturity || 
        moisturePercent === null || defectPercent === null ||
        !hardwareWeight || !hardwareMoisture || !currentBaleData) {
      toast.error("Missing required data");
      return;
    }

    setIsSubmitting(true);
    try {
      const submission: GradingSubmission = {
        baleId: currentBaleData.id,
        baleCode: currentBaleData.code,
        farmerId: currentBaleData.farmerId,
        warehouseId: currentBaleData.warehouseId,
        companyId: companyId || 'demo-company',
        weight: hardwareWeight,
        moisture: hardwareMoisture,
        leafPosition: position,
        color,
        texture,
        maturity,
        qualityBand: gradeResult.eligibility?.suggestedQualityBand || 2,
        defectPercent,
        aiSuggestedGrade: aiSuggestions.length > 0 ? gradeResult.grade : undefined,
        aiDecisions: Object.keys(aiDecisions).length > 0 ? 
          Object.fromEntries(
            Object.entries(aiDecisions).map(([key, val]) => [
              key, 
              { decision: val.decision as 'accept' | 'modify' | 'reject', aiValue: val.aiValue, finalValue: val.finalValue }
            ])
          ) : undefined,
        gradeCode: gradeResult.grade,
        gradeClass: gradeResult.class,
        unitPrice: priceBreakdown?.finalPricePerKg || 0,
        totalValue: priceBreakdown?.totalValue || 0,
        currency: 'USD',
        riskScore: auditRiskScore,
        requiresSupervisorApproval,
      };

      const result = await submitGrading(submission);

      if (result.success) {
        if (result.isOffline) {
          toast.info("Grading saved offline", {
            description: "Will sync when connection is restored"
          });
        } else if (result.requiresApproval) {
          toast.warning("Grading requires approval", {
            description: "Supervisor will review this grading"
          });
        } else {
          toast.success("Grading submitted successfully", {
            description: `Grade ${gradeResult.grade} recorded for ${currentBaleData.code}`
          });
        }
        
        // Reset for next bale
        setWorkflowStep('hardware');
        setCurrentBaleData(null);
        setHardwareWeight(null);
        setHardwareMoisture(null);
        setCapturedImage(null);
        setAiSuggestions([]);
        setAiDecisions({});
        setPosition(null);
        setColor(null);
        setTexture(null);
        setMaturity(null);
        setMoisturePercent(null);
        setDefectPercent(null);
        setAuditRiskScore(0);
        setRequiresSupervisorApproval(false);
      } else {
        toast.error("Submission failed", {
          description: result.error || "Please try again"
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error("Failed to submit grading");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show hardware workflow step
  if (workflowStep === 'hardware') {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6 pb-32">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tobacco Grading</h1>
              <p className="text-muted-foreground">Hardware-first workflow with manual fallback</p>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <Bluetooth className="h-3 w-3 mr-1" />
              Step 1: Hardware Capture
            </Badge>
          </div>
          <HardwareGradingWorkflow onComplete={handleHardwareComplete} />
        </div>
      </AppLayout>
    );
  }

  if (showCamera) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <ImageCaptureGuidance
            onImageCapture={handleImageCapture}
            onCancel={() => setShowCamera(false)}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-32">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tobacco Grading</h1>
            <p className="text-muted-foreground">AI-assisted grading with human approval</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="default">
              <Scan className="h-4 w-4 mr-2" />
              Scan QR
            </Button>
            <Button variant="enterprise" size="default" onClick={() => setShowCamera(true)}>
              <Brain className="h-4 w-4 mr-2" />
              AI Grade
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="card-elevated p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by bale code, farmer name, or contract number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
        </div>

        {/* Current Bale Info */}
        {currentBaleData && hardwareWeight && (
          <div className="card-elevated p-6 gradient-hero text-primary-foreground">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <span className="font-mono text-lg font-bold">{currentBaleData.code}</span>
                </div>
                <div className="flex items-center gap-4 text-primary-foreground/80 text-sm">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {currentBaleData.farmerName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Scale className="h-4 w-4" />
                    {hardwareWeight.value} kg
                  </span>
                </div>
              </div>
              <div className="text-right text-sm text-primary-foreground/70">
                <p>Moisture: {hardwareMoisture?.value}%</p>
                <AuditRiskBadge score={auditRiskScore} level={auditRiskScore <= 20 ? 'low' : auditRiskScore <= 40 ? 'medium' : auditRiskScore <= 70 ? 'high' : 'critical'} />
              </div>
            </div>
          </div>
        )}

        {/* Captured Image Preview */}
        {capturedImage && (
          <div className="card-elevated overflow-hidden">
            <div className="relative aspect-video">
              <img src={capturedImage} alt="Captured leaf" className="w-full h-full object-cover" />
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => {
                  setCapturedImage(null);
                  setAiSuggestions([]);
                  setAiDecisions({});
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* AI Analysis Panel */}
        {(aiSuggestions.length > 0 || isAnalyzing) && (
          <AIAnalysisPanel
            suggestions={aiSuggestions}
            decisions={aiDecisions}
            onDecision={handleAIDecision}
            isAnalyzing={isAnalyzing}
            processingTimeMs={processingTimeMs}
            overallConfidence={overallConfidence}
            explanation={aiExplanation}
          />
        )}

        {/* Manual Selection Grids */}
        <div className="space-y-4">
          {/* Leaf Position */}
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Leaf className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Stalk Position</h3>
              {aiDecisions.leaf_position?.decision === 'accept' && (
                <Badge variant="secondary" className="bg-success/20 text-success">AI Accepted</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(LEAF_POSITIONS) as LeafPosition[]).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosition(pos)}
                  className={cn(
                    "grading-button rounded-lg border-2 font-medium transition-all p-3",
                    position === pos
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  <div className="text-lg font-bold">{LEAF_POSITIONS[pos].code}</div>
                  <div className="text-xs">{LEAF_POSITIONS[pos].label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20 text-warning">
                <span className="font-bold text-sm">CLR</span>
              </div>
              <h3 className="font-semibold text-foreground">Color</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(TOBACCO_COLORS) as TobaccoColor[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "grading-button rounded-lg border-2 font-medium transition-all p-3",
                    color === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  {TOBACCO_COLORS[c].label}
                </button>
              ))}
            </div>
          </div>

          {/* Texture */}
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Leaf className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Texture / Body</h3>
              {aiDecisions.texture?.decision === 'accept' && (
                <Badge variant="secondary" className="bg-success/20 text-success">AI Accepted</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(TOBACCO_TEXTURES) as TobaccoTexture[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTexture(t)}
                  className={cn(
                    "grading-button rounded-lg border-2 font-medium transition-all p-3",
                    texture === t
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  <div className="text-lg font-bold">{TOBACCO_TEXTURES[t].code}</div>
                  <div className="text-xs">{TOBACCO_TEXTURES[t].label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Maturity */}
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Leaf className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Maturity</h3>
              {aiDecisions.maturity?.decision === 'accept' && (
                <Badge variant="secondary" className="bg-success/20 text-success">AI Accepted</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(TOBACCO_MATURITY) as TobaccoMaturity[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMaturity(m)}
                  className={cn(
                    "grading-button rounded-lg border-2 font-medium transition-all p-3",
                    maturity === m
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  {TOBACCO_MATURITY[m].label}
                </button>
              ))}
            </div>
          </div>

          <div className="card-elevated p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Droplets className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Moisture %</h3>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[10, 12, 13, 14, 15, 16, 17, 18].map((m) => {
                const validation = position ? validateMoisture(m, position) : null;
                return (
                  <button
                    key={m}
                    onClick={() => setMoisturePercent(m)}
                    className={cn(
                      "grading-button rounded-lg border-2 font-mono font-medium transition-all p-3",
                      moisturePercent === m
                        ? validation?.status === 'safe' 
                          ? "border-success bg-success text-success-foreground"
                          : validation?.status === 'marginal'
                          ? "border-warning bg-warning text-warning-foreground"
                          : "border-destructive bg-destructive text-destructive-foreground"
                        : "border-border bg-background hover:border-primary/50"
                    )}
                  >
                    {m}%
                  </button>
                );
              })}
            </div>
          </div>

          {/* Defects */}
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Defect %</h3>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[0, 2, 5, 8, 10, 15, 20, 25].map((d) => (
                <button
                  key={d}
                  onClick={() => setDefectPercent(d)}
                  className={cn(
                    "grading-button rounded-lg border-2 font-mono font-medium transition-all p-3",
                    defectPercent === d
                      ? d <= 5 
                        ? "border-success bg-success text-success-foreground"
                        : d <= 15
                        ? "border-warning bg-warning text-warning-foreground"
                        : "border-destructive bg-destructive text-destructive-foreground"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  {d}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        {priceBreakdown && gradeResult && (
          <PriceBreakdownCard
            breakdown={priceBreakdown}
            weightKg={hardwareWeight?.value || 0}
            gradeCode={gradeResult.grade}
            showFarmerView={false}
          />
        )}

        {/* Calculated Grade & Submit - Sticky Footer */}
        <div className="card-elevated p-6 fixed bottom-4 left-4 right-4 max-w-4xl mx-auto bg-card/95 backdrop-blur z-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground font-medium">Final Grade:</span>
              {gradeResult ? (
                <span className={cn("px-6 py-2 rounded-lg text-xl font-bold font-mono", gradeClassColors[gradeResult.class])}>
                  {gradeResult.grade}
                </span>
              ) : (
                <span className="px-6 py-2 rounded-lg text-xl font-bold bg-muted text-muted-foreground">---</span>
              )}
            </div>
            <Button 
              variant="enterprise" 
              size="lg" 
              disabled={!gradeResult || isSubmitting} 
              onClick={handleConfirmGrade}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              {isSubmitting ? 'Submitting...' : 'Confirm Grade'}
              {!isSubmitting && <ChevronRight className="h-5 w-5 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}