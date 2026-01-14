/**
 * AI Analysis Panel - Human-in-the-Loop Controls
 * 
 * Displays AI suggestions with confidence scores and allows
 * graders to Accept, Modify, or Reject each attribute.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Brain,
  Check,
  Pencil,
  X,
  AlertTriangle,
  Info,
  Sparkles,
  Clock,
  Eye,
} from 'lucide-react';

export type Decision = 'accept' | 'modify' | 'reject' | 'pending';

export interface AISuggestion {
  attribute: string;
  aiValue: string;
  aiLabel: string;
  confidence: number;
  reasoning: string;
}

export interface AIDecision {
  attribute: string;
  decision: Decision;
  aiValue: string;
  finalValue: string;
}

interface AIAnalysisPanelProps {
  suggestions: AISuggestion[];
  decisions: Record<string, AIDecision>;
  onDecision: (attribute: string, decision: Decision, finalValue?: string) => void;
  isAnalyzing?: boolean;
  processingTimeMs?: number;
  overallConfidence?: number;
  explanation?: string;
  className?: string;
}

const confidenceColor = (confidence: number) => {
  if (confidence >= 90) return 'text-success';
  if (confidence >= 70) return 'text-primary';
  if (confidence >= 50) return 'text-warning';
  return 'text-destructive';
};

const confidenceLabel = (confidence: number) => {
  if (confidence >= 90) return 'Very High';
  if (confidence >= 70) return 'High';
  if (confidence >= 50) return 'Moderate';
  return 'Low';
};

export function AIAnalysisPanel({
  suggestions,
  decisions,
  onDecision,
  isAnalyzing,
  processingTimeMs,
  overallConfidence,
  explanation,
  className,
}: AIAnalysisPanelProps) {
  const [expandedAttribute, setExpandedAttribute] = useState<string | null>(null);

  if (isAnalyzing) {
    return (
      <div className={cn("card-elevated p-6", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Analysis</h3>
            <p className="text-sm text-muted-foreground">Analyzing leaf characteristics...</p>
          </div>
        </div>
        <div className="space-y-3">
          {['Detecting color...', 'Identifying defects...', 'Assessing texture...'].map((text, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground animate-pulse">
              <div className="h-2 w-2 rounded-full bg-primary/50" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const allDecided = suggestions.every(s => decisions[s.attribute]?.decision !== 'pending');
  const acceptCount = Object.values(decisions).filter(d => d.decision === 'accept').length;
  const modifyCount = Object.values(decisions).filter(d => d.decision === 'modify').length;
  const rejectCount = Object.values(decisions).filter(d => d.decision === 'reject').length;

  return (
    <div className={cn("card-elevated overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Suggestions</h3>
              <p className="text-sm text-muted-foreground">Review and approve each attribute</p>
            </div>
          </div>
          {processingTimeMs && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{(processingTimeMs / 1000).toFixed(1)}s</span>
            </div>
          )}
        </div>

        {/* Overall confidence */}
        {overallConfidence !== undefined && (
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Overall Confidence:</span>
            <div className="flex-1 flex items-center gap-2">
              <Progress value={overallConfidence} className="h-2" />
              <span className={cn("text-sm font-medium", confidenceColor(overallConfidence))}>
                {overallConfidence}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="px-4 py-3 bg-muted/30 border-b border-border/50">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">{explanation}</p>
          </div>
        </div>
      )}

      {/* Suggestions List */}
      <div className="divide-y divide-border/50">
        {suggestions.map((suggestion) => {
          const decision = decisions[suggestion.attribute];
          const isExpanded = expandedAttribute === suggestion.attribute;
          
          return (
            <div key={suggestion.attribute} className="p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Attribute Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground capitalize">
                      {suggestion.attribute.replace(/_/g, ' ')}
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", confidenceColor(suggestion.confidence))}
                          >
                            {suggestion.confidence}%
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{confidenceLabel(suggestion.confidence)} confidence</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">AI suggests:</span>
                    <span className="text-sm font-medium text-primary">
                      {suggestion.aiLabel}
                    </span>
                    {decision?.decision === 'modify' && decision.finalValue !== decision.aiValue && (
                      <>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-sm font-medium text-warning">
                          {decision.finalValue}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Reasoning (expandable) */}
                  <button
                    onClick={() => setExpandedAttribute(isExpanded ? null : suggestion.attribute)}
                    className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    <span>{isExpanded ? 'Hide' : 'Show'} reasoning</span>
                  </button>
                  
                  {isExpanded && (
                    <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {suggestion.reasoning}
                    </p>
                  )}
                </div>

                {/* Decision Buttons */}
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={decision?.decision === 'accept' ? 'default' : 'outline'}
                          className={cn(
                            "h-9 w-9 p-0",
                            decision?.decision === 'accept' && "bg-success hover:bg-success/90"
                          )}
                          onClick={() => onDecision(suggestion.attribute, 'accept', suggestion.aiValue)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Accept AI suggestion</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={decision?.decision === 'modify' ? 'default' : 'outline'}
                          className={cn(
                            "h-9 w-9 p-0",
                            decision?.decision === 'modify' && "bg-warning hover:bg-warning/90"
                          )}
                          onClick={() => onDecision(suggestion.attribute, 'modify')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Modify value</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={decision?.decision === 'reject' ? 'default' : 'outline'}
                          className={cn(
                            "h-9 w-9 p-0",
                            decision?.decision === 'reject' && "bg-destructive hover:bg-destructive/90"
                          )}
                          onClick={() => onDecision(suggestion.attribute, 'reject')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reject and select manually</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="p-4 border-t border-border/50 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            {acceptCount > 0 && (
              <span className="flex items-center gap-1 text-success">
                <Check className="h-4 w-4" />
                {acceptCount} accepted
              </span>
            )}
            {modifyCount > 0 && (
              <span className="flex items-center gap-1 text-warning">
                <Pencil className="h-4 w-4" />
                {modifyCount} modified
              </span>
            )}
            {rejectCount > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <X className="h-4 w-4" />
                {rejectCount} rejected
              </span>
            )}
          </div>
          
          {!allDecided && (
            <div className="flex items-center gap-1 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span>{suggestions.length - Object.keys(decisions).filter(k => decisions[k].decision !== 'pending').length} pending</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}