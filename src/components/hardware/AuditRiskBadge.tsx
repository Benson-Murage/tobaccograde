/**
 * Audit Risk Badge
 * 
 * Visual indicator for manual entry risk levels.
 * Used throughout the UI to highlight audit concerns.
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface AuditRiskBadgeProps {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors?: string[];
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AuditRiskBadge({
  score,
  level,
  factors = [],
  showScore = true,
  size = 'md',
  className,
}: AuditRiskBadgeProps) {
  const config = {
    low: {
      icon: ShieldCheck,
      label: 'Low Risk',
      bgClass: 'bg-success/10 hover:bg-success/20',
      textClass: 'text-success',
      borderClass: 'border-success/30',
    },
    medium: {
      icon: Shield,
      label: 'Medium Risk',
      bgClass: 'bg-warning/10 hover:bg-warning/20',
      textClass: 'text-warning',
      borderClass: 'border-warning/30',
    },
    high: {
      icon: ShieldAlert,
      label: 'High Risk',
      bgClass: 'bg-destructive/10 hover:bg-destructive/20',
      textClass: 'text-destructive',
      borderClass: 'border-destructive/30',
    },
    critical: {
      icon: AlertTriangle,
      label: 'Critical Risk',
      bgClass: 'bg-destructive hover:bg-destructive/90',
      textClass: 'text-destructive-foreground',
      borderClass: 'border-destructive',
    },
  };

  const { icon: Icon, label, bgClass, textClass, borderClass } = config[level];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "cursor-help transition-colors",
              bgClass,
              textClass,
              borderClass,
              sizeClasses[size],
              className
            )}
          >
            <Icon className={cn(iconSizes[size], "mr-1")} />
            {showScore ? (
              <span className="font-mono">{score}</span>
            ) : (
              <span>{label}</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{label}</span>
              <span className="font-mono text-sm">{score}/100</span>
            </div>
            {factors.length > 0 ? (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Risk factors:</p>
                <ul className="text-xs space-y-0.5">
                  {factors.map((factor, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-current" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                All data captured from hardware devices
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Inline variant for tables
export function AuditRiskIndicator({
  source,
  manualReason,
}: {
  source: 'hardware' | 'manual';
  manualReason?: string;
}) {
  if (source === 'hardware') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <ShieldCheck className="h-4 w-4 text-success" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Hardware reading - trusted source</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <AlertTriangle className="h-4 w-4 text-warning" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Manual Entry</p>
          {manualReason && (
            <p className="text-xs text-muted-foreground">{manualReason}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
