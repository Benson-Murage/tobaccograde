/**
 * Price Breakdown Card - Farmer Transparency Feature
 * 
 * Shows exactly how the price was calculated with full transparency.
 * Every shilling/dollar is traceable to a grading factor.
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Banknote,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Scale,
} from 'lucide-react';
import { useState } from 'react';
import type { TobaccoPriceBreakdown } from '@/lib/tobacco-grading';

interface PriceBreakdownCardProps {
  breakdown: TobaccoPriceBreakdown;
  weightKg: number;
  gradeCode: string;
  className?: string;
  showFarmerView?: boolean;
}

export function PriceBreakdownCard({
  breakdown,
  weightKg,
  gradeCode,
  className,
  showFarmerView = false,
}: PriceBreakdownCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: breakdown.currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const positiveFactors = breakdown.factors.filter(f => f.impact >= 0);
  const negativeFactors = breakdown.factors.filter(f => f.impact < 0);

  return (
    <div className={cn("card-elevated overflow-hidden", className)}>
      {/* Header - Always visible */}
      <div className="p-4 bg-gradient-to-r from-success/10 to-transparent border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <Banknote className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Payment</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(breakdown.totalValue)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="font-mono text-lg">
              {gradeCode}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              {weightKg} kg × {formatCurrency(breakdown.finalPricePerKg)}/kg
            </p>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>{showFarmerView ? 'See how your price was calculated' : 'View price calculation details'}</span>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isExpanded && "transform rotate-180"
          )} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {/* Base Price */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-foreground">Season Base Price</p>
                <p className="text-sm text-muted-foreground">Starting price per kilogram</p>
              </div>
              <span className="font-mono text-lg">
                {formatCurrency(breakdown.basePrice)}/kg
              </span>
            </div>

            <Separator />

            {/* Positive Factors */}
            {positiveFactors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-success">
                  <TrendingUp className="h-4 w-4" />
                  <span>Price Additions</span>
                </div>
                {positiveFactors.slice(1).map((factor, i) => ( // Skip first (base price)
                  <div key={i} className="flex items-center justify-between pl-6 text-sm">
                    <div>
                      <p className="text-foreground">{factor.factor}</p>
                      <p className="text-muted-foreground text-xs">{factor.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-success font-medium">
                        +{formatCurrency(factor.impact)}
                      </span>
                      <span className="text-muted-foreground text-xs block">
                        {formatPercentage(factor.percentage)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Negative Factors */}
            {negativeFactors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <TrendingDown className="h-4 w-4" />
                  <span>Price Deductions</span>
                </div>
                {negativeFactors.map((factor, i) => (
                  <div key={i} className="flex items-center justify-between pl-6 text-sm">
                    <div>
                      <p className="text-foreground">{factor.factor}</p>
                      <p className="text-muted-foreground text-xs">{factor.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-destructive font-medium">
                        {formatCurrency(factor.impact)}
                      </span>
                      <span className="text-muted-foreground text-xs block">
                        {formatPercentage(factor.percentage)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            {/* Final Calculation */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Final price per kg</span>
                <span className="font-mono font-medium">
                  {formatCurrency(breakdown.finalPricePerKg)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  Bale weight
                </span>
                <span className="font-mono font-medium">{weightKg} kg</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold">Your Payment</span>
                <span className="text-xl font-bold text-success">
                  {formatCurrency(breakdown.totalValue)}
                </span>
              </div>
            </div>

            {/* Farmer-friendly explanation */}
            {showFarmerView && (
              <div className="bg-primary/5 rounded-lg p-4 text-sm">
                <p className="text-muted-foreground">
                  This payment is calculated based on the official grading of your tobacco bale. 
                  The grade <span className="font-mono font-medium text-foreground">{gradeCode}</span> was 
                  determined by evaluating leaf position, color, texture, moisture content, and any defects. 
                  If you believe there was an error, you may raise a dispute within 24 hours.
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}