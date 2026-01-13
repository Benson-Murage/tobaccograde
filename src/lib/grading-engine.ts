/**
 * LeafGrade - Configurable Tobacco Grading Engine
 * 
 * This engine evaluates tobacco based on configured rules and calculates grades.
 * Rules are fully configurable via the admin UI and version-controlled.
 */

// Types
export interface GradingParameters {
  leafPosition: 'lugs' | 'cutters' | 'leaf' | 'tips';
  color: 'lemon' | 'orange' | 'reddish' | 'brown' | 'greenish';
  maturity: 'under' | 'mature' | 'over';
  texture: 'thin' | 'medium' | 'heavy';
  moisturePercent: number;
  defectPercent: number;
  uniformityScore?: number;
}

export interface GradingRule {
  id: string;
  name: string;
  priority: number;
  conditions: RuleCondition[];
  resultGrade: string;
  resultClass: 'premium' | 'good' | 'standard' | 'low' | 'rejected';
}

export interface RuleCondition {
  field: keyof GradingParameters;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';
  value: string | number | string[] | [number, number];
}

export interface GradingResult {
  gradeCode: string;
  gradeClass: 'premium' | 'good' | 'standard' | 'low' | 'rejected';
  confidenceScore: number;
  matchedRule: string | null;
  warnings: string[];
  pricePerKg?: number;
}

// Default grading rules (can be overridden by company config)
export const DEFAULT_GRADING_RULES: GradingRule[] = [
  // Premium grades
  {
    id: 'L1F',
    name: 'Premium Lemon Leaf',
    priority: 1,
    conditions: [
      { field: 'leafPosition', operator: 'eq', value: 'leaf' },
      { field: 'color', operator: 'eq', value: 'lemon' },
      { field: 'maturity', operator: 'eq', value: 'mature' },
      { field: 'moisturePercent', operator: 'between', value: [12, 18] },
      { field: 'defectPercent', operator: 'lt', value: 5 },
    ],
    resultGrade: 'L1F',
    resultClass: 'premium',
  },
  {
    id: 'L1O',
    name: 'Premium Orange Leaf',
    priority: 2,
    conditions: [
      { field: 'leafPosition', operator: 'eq', value: 'leaf' },
      { field: 'color', operator: 'eq', value: 'orange' },
      { field: 'maturity', operator: 'eq', value: 'mature' },
      { field: 'moisturePercent', operator: 'between', value: [12, 18] },
      { field: 'defectPercent', operator: 'lt', value: 5 },
    ],
    resultGrade: 'L1O',
    resultClass: 'premium',
  },
  // Good grades
  {
    id: 'L2F',
    name: 'Good Lemon Leaf',
    priority: 10,
    conditions: [
      { field: 'leafPosition', operator: 'eq', value: 'leaf' },
      { field: 'color', operator: 'in', value: ['lemon', 'orange'] },
      { field: 'moisturePercent', operator: 'between', value: [12, 18] },
      { field: 'defectPercent', operator: 'lt', value: 10 },
    ],
    resultGrade: 'L2F',
    resultClass: 'good',
  },
  {
    id: 'C1F',
    name: 'Premium Cutters',
    priority: 11,
    conditions: [
      { field: 'leafPosition', operator: 'eq', value: 'cutters' },
      { field: 'color', operator: 'in', value: ['lemon', 'orange'] },
      { field: 'maturity', operator: 'eq', value: 'mature' },
      { field: 'moisturePercent', operator: 'between', value: [12, 18] },
      { field: 'defectPercent', operator: 'lt', value: 5 },
    ],
    resultGrade: 'C1F',
    resultClass: 'good',
  },
  // Standard grades
  {
    id: 'C2F',
    name: 'Standard Cutters',
    priority: 20,
    conditions: [
      { field: 'leafPosition', operator: 'eq', value: 'cutters' },
      { field: 'moisturePercent', operator: 'between', value: [10, 20] },
      { field: 'defectPercent', operator: 'lt', value: 15 },
    ],
    resultGrade: 'C2F',
    resultClass: 'standard',
  },
  {
    id: 'P1F',
    name: 'Premium Lugs',
    priority: 21,
    conditions: [
      { field: 'leafPosition', operator: 'eq', value: 'lugs' },
      { field: 'color', operator: 'in', value: ['lemon', 'orange'] },
      { field: 'defectPercent', operator: 'lt', value: 10 },
    ],
    resultGrade: 'P1F',
    resultClass: 'standard',
  },
  // Low grades
  {
    id: 'X2F',
    name: 'Mixed Low Quality',
    priority: 50,
    conditions: [
      { field: 'defectPercent', operator: 'lt', value: 25 },
    ],
    resultGrade: 'X2F',
    resultClass: 'low',
  },
  // Rejected
  {
    id: 'REJ',
    name: 'Rejected',
    priority: 100,
    conditions: [
      { field: 'defectPercent', operator: 'gte', value: 25 },
    ],
    resultGrade: 'REJ',
    resultClass: 'rejected',
  },
];

// Default price matrix (USD per kg)
export const DEFAULT_PRICE_MATRIX: Record<string, number> = {
  'L1F': 4.50,
  'L1O': 4.25,
  'L2F': 3.80,
  'C1F': 3.50,
  'C2F': 3.00,
  'P1F': 2.50,
  'X2F': 1.50,
  'REJ': 0.50,
};

// Condition evaluator
function evaluateCondition(params: GradingParameters, condition: RuleCondition): boolean {
  const value = params[condition.field];
  
  switch (condition.operator) {
    case 'eq':
      return value === condition.value;
    case 'ne':
      return value !== condition.value;
    case 'gt':
      return typeof value === 'number' && value > (condition.value as number);
    case 'gte':
      return typeof value === 'number' && value >= (condition.value as number);
    case 'lt':
      return typeof value === 'number' && value < (condition.value as number);
    case 'lte':
      return typeof value === 'number' && value <= (condition.value as number);
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(value as string);
    case 'between':
      if (Array.isArray(condition.value) && condition.value.length === 2) {
        const [min, max] = condition.value as [number, number];
        return typeof value === 'number' && value >= min && value <= max;
      }
      return false;
    default:
      return false;
  }
}

// Rule evaluator
function evaluateRule(params: GradingParameters, rule: GradingRule): boolean {
  return rule.conditions.every((condition) => evaluateCondition(params, condition));
}

// Calculate confidence score based on how well params match ideal
function calculateConfidence(params: GradingParameters, _gradeClass: string): number {
  let score = 100;

  // Moisture penalties
  if (params.moisturePercent < 12) {
    score -= 10;
  } else if (params.moisturePercent > 18) {
    score -= 15;
  }

  // Defect penalties
  if (params.defectPercent > 0) {
    score -= params.defectPercent * 2;
  }

  // Maturity bonus/penalty
  if (params.maturity === 'mature') {
    score += 5;
  } else {
    score -= 10;
  }

  // Texture considerations
  if (params.texture === 'medium') {
    score += 3;
  }

  return Math.max(0, Math.min(100, score));
}

// Main grading function
export function calculateGrade(
  params: GradingParameters,
  rules: GradingRule[] = DEFAULT_GRADING_RULES,
  priceMatrix: Record<string, number> = DEFAULT_PRICE_MATRIX
): GradingResult {
  const warnings: string[] = [];

  // Validation warnings
  if (params.moisturePercent < 10) {
    warnings.push('Very low moisture - may affect quality');
  } else if (params.moisturePercent > 20) {
    warnings.push('High moisture - drying recommended');
  }

  if (params.defectPercent > 15) {
    warnings.push('High defect rate detected');
  }

  // Sort rules by priority
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  // Find matching rule
  for (const rule of sortedRules) {
    if (evaluateRule(params, rule)) {
      return {
        gradeCode: rule.resultGrade,
        gradeClass: rule.resultClass,
        confidenceScore: calculateConfidence(params, rule.resultClass),
        matchedRule: rule.id,
        warnings,
        pricePerKg: priceMatrix[rule.resultGrade] ?? 0,
      };
    }
  }

  // Default to rejected if no rules match
  return {
    gradeCode: 'REJ',
    gradeClass: 'rejected',
    confidenceScore: 0,
    matchedRule: null,
    warnings: [...warnings, 'No matching grade rule found'],
    pricePerKg: priceMatrix['REJ'] ?? 0,
  };
}

// Calculate bale value
export function calculateBaleValue(
  gradeCode: string,
  weightKg: number,
  priceMatrix: Record<string, number> = DEFAULT_PRICE_MATRIX
): { pricePerKg: number; totalValue: number } {
  const pricePerKg = priceMatrix[gradeCode] ?? 0;
  return {
    pricePerKg,
    totalValue: Math.round(pricePerKg * weightKg * 100) / 100,
  };
}

// Parse rules from JSON config
export function parseRulesFromConfig(config: unknown): GradingRule[] {
  if (!config || typeof config !== 'object') {
    return DEFAULT_GRADING_RULES;
  }
  
  try {
    const configObj = config as { rules?: GradingRule[] };
    if (Array.isArray(configObj.rules)) {
      return configObj.rules;
    }
  } catch {
    console.error('Failed to parse grading rules config');
  }
  
  return DEFAULT_GRADING_RULES;
}

// Parse price matrix from JSON config
export function parsePricesFromConfig(config: unknown): Record<string, number> {
  if (!config || typeof config !== 'object') {
    return DEFAULT_PRICE_MATRIX;
  }
  
  try {
    return config as Record<string, number>;
  } catch {
    console.error('Failed to parse price matrix config');
  }
  
  return DEFAULT_PRICE_MATRIX;
}

// Grade class display helpers
export const GRADE_CLASS_COLORS = {
  premium: { bg: 'bg-grade-premium', text: 'text-grade-premium-foreground', label: 'Premium' },
  good: { bg: 'bg-grade-good', text: 'text-grade-good-foreground', label: 'Good' },
  standard: { bg: 'bg-grade-standard', text: 'text-grade-standard-foreground', label: 'Standard' },
  low: { bg: 'bg-grade-low', text: 'text-grade-low-foreground', label: 'Low' },
  rejected: { bg: 'bg-grade-rejected', text: 'text-grade-rejected-foreground', label: 'Rejected' },
};

export const LEAF_POSITION_LABELS: Record<string, string> = {
  lugs: 'Lugs (P)',
  cutters: 'Cutters (C)',
  leaf: 'Leaf (L)',
  tips: 'Tips (T)',
};

export const COLOR_LABELS: Record<string, string> = {
  lemon: 'Lemon',
  orange: 'Orange',
  reddish: 'Reddish',
  brown: 'Brown',
  greenish: 'Greenish',
};

export const MATURITY_LABELS: Record<string, string> = {
  under: 'Under-mature',
  mature: 'Mature',
  over: 'Over-mature',
};

export const TEXTURE_LABELS: Record<string, string> = {
  thin: 'Thin',
  medium: 'Medium',
  heavy: 'Heavy',
};
