/**
 * LeafGrade - Tobacco-Specific Grading Logic
 * 
 * This module contains tobacco-industry-specific grading rules, terminology,
 * and calculations based on real auction floor standards.
 */

// =============================================================================
// TOBACCO INDUSTRY TERMINOLOGY & CONSTANTS
// =============================================================================

/**
 * Leaf Position (Stalk Position)
 * Bottom-to-top on the tobacco plant
 */
export type LeafPosition = 'primings' | 'lugs' | 'cutters' | 'leaf' | 'tips';

export const LEAF_POSITIONS: Record<LeafPosition, {
  code: string;
  label: string;
  description: string;
  priceMultiplier: number;
  moistureRange: { min: number; max: number; ideal: number };
  defectTolerance: number; // Max allowed defect %
}> = {
  primings: {
    code: 'P',
    label: 'Primings',
    description: 'Bottom leaves, sand lugs. Higher defect tolerance.',
    priceMultiplier: 0.65,
    moistureRange: { min: 10, max: 20, ideal: 14 },
    defectTolerance: 20,
  },
  lugs: {
    code: 'X',
    label: 'Lugs',
    description: 'Lower leaves. Good filler tobacco.',
    priceMultiplier: 0.75,
    moistureRange: { min: 11, max: 19, ideal: 14 },
    defectTolerance: 15,
  },
  cutters: {
    code: 'C',
    label: 'Cutters',
    description: 'Middle-lower leaves. Used for cigarette blends.',
    priceMultiplier: 0.90,
    moistureRange: { min: 12, max: 18, ideal: 15 },
    defectTolerance: 10,
  },
  leaf: {
    code: 'L',
    label: 'Leaf',
    description: 'Middle leaves. Premium quality, best for wrappers.',
    priceMultiplier: 1.00,
    moistureRange: { min: 12, max: 17, ideal: 14 },
    defectTolerance: 8,
  },
  tips: {
    code: 'T',
    label: 'Tips',
    description: 'Top leaves. Smaller, may be over-mature.',
    priceMultiplier: 0.80,
    moistureRange: { min: 11, max: 17, ideal: 13 },
    defectTolerance: 12,
  },
};

/**
 * Tobacco Color Classifications
 * Based on cure quality and market preferences
 */
export type TobaccoColor = 'lemon' | 'orange' | 'mahogany' | 'brown' | 'green';

export const TOBACCO_COLORS: Record<TobaccoColor, {
  code: string;
  label: string;
  description: string;
  priceMultiplier: number;
  cureQuality: 'excellent' | 'good' | 'fair' | 'poor';
  marketPreference: 'high' | 'medium' | 'low';
}> = {
  lemon: {
    code: 'L',
    label: 'Lemon',
    description: 'Bright yellow. Excellent cure, premium quality.',
    priceMultiplier: 1.15,
    cureQuality: 'excellent',
    marketPreference: 'high',
  },
  orange: {
    code: 'F',
    label: 'Orange',
    description: 'Golden-orange. Good cure quality.',
    priceMultiplier: 1.00,
    cureQuality: 'good',
    marketPreference: 'high',
  },
  mahogany: {
    code: 'R',
    label: 'Mahogany',
    description: 'Reddish-brown. Slightly over-cured.',
    priceMultiplier: 0.85,
    cureQuality: 'fair',
    marketPreference: 'medium',
  },
  brown: {
    code: 'D',
    label: 'Brown/Dark',
    description: 'Dark brown. Over-cured or damaged.',
    priceMultiplier: 0.60,
    cureQuality: 'poor',
    marketPreference: 'low',
  },
  green: {
    code: 'G',
    label: 'Green',
    description: 'Greenish tinge. Under-cured, penalty grade.',
    priceMultiplier: 0.40,
    cureQuality: 'poor',
    marketPreference: 'low',
  },
};

/**
 * Texture/Body Classification
 * Critical for burn quality and price
 */
export type TobaccoTexture = 'papery' | 'thin' | 'medium' | 'heavy' | 'coarse';

export const TOBACCO_TEXTURES: Record<TobaccoTexture, {
  code: string;
  label: string;
  description: string;
  priceMultiplier: number;
  burnQuality: 'excellent' | 'good' | 'fair' | 'poor';
}> = {
  papery: {
    code: 'V',
    label: 'Papery/Very Thin',
    description: 'Extremely thin, delicate. Burns too fast.',
    priceMultiplier: 0.70,
    burnQuality: 'poor',
  },
  thin: {
    code: 'K',
    label: 'Thin',
    description: 'Light body. Good for certain blends.',
    priceMultiplier: 0.90,
    burnQuality: 'good',
  },
  medium: {
    code: 'F',
    label: 'Medium',
    description: 'Ideal body. Best burn characteristics.',
    priceMultiplier: 1.00,
    burnQuality: 'excellent',
  },
  heavy: {
    code: 'H',
    label: 'Heavy',
    description: 'Thick, substantial. May burn unevenly.',
    priceMultiplier: 0.85,
    burnQuality: 'fair',
  },
  coarse: {
    code: 'S',
    label: 'Coarse/Spongy',
    description: 'Rough texture. Poor quality.',
    priceMultiplier: 0.55,
    burnQuality: 'poor',
  },
};

/**
 * Maturity Levels
 */
export type TobaccoMaturity = 'immature' | 'unripe' | 'ripe' | 'mature' | 'overripe';

export const TOBACCO_MATURITY: Record<TobaccoMaturity, {
  label: string;
  description: string;
  priceMultiplier: number;
  gradeEligibility: ('premium' | 'good' | 'standard' | 'low' | 'rejected')[];
}> = {
  immature: {
    label: 'Immature',
    description: 'Green, undeveloped. Not market-ready.',
    priceMultiplier: 0.30,
    gradeEligibility: ['rejected'],
  },
  unripe: {
    label: 'Unripe',
    description: 'Slightly green, needs more time.',
    priceMultiplier: 0.60,
    gradeEligibility: ['low', 'rejected'],
  },
  ripe: {
    label: 'Ripe',
    description: 'Properly developed. Good quality.',
    priceMultiplier: 0.95,
    gradeEligibility: ['premium', 'good', 'standard'],
  },
  mature: {
    label: 'Mature',
    description: 'Fully developed. Best quality.',
    priceMultiplier: 1.00,
    gradeEligibility: ['premium', 'good', 'standard'],
  },
  overripe: {
    label: 'Over-mature',
    description: 'Past optimal. Brittle, dark.',
    priceMultiplier: 0.70,
    gradeEligibility: ['standard', 'low'],
  },
};

/**
 * Defect Types in Tobacco
 */
export type TobaccoDefect = 
  | 'holes'
  | 'tears'
  | 'mold'
  | 'insect_damage'
  | 'sunburn'
  | 'bruising'
  | 'foreign_matter'
  | 'sand_damage';

export const TOBACCO_DEFECTS: Record<TobaccoDefect, {
  label: string;
  severity: 'minor' | 'moderate' | 'severe';
  penaltyMultiplier: number;
  description: string;
}> = {
  holes: {
    label: 'Holes',
    severity: 'moderate',
    penaltyMultiplier: 0.92,
    description: 'Missing leaf material from insects or handling',
  },
  tears: {
    label: 'Tears/Rips',
    severity: 'minor',
    penaltyMultiplier: 0.95,
    description: 'Leaf damage from handling',
  },
  mold: {
    label: 'Mold/Fungi',
    severity: 'severe',
    penaltyMultiplier: 0.50,
    description: 'Fungal growth - may require rejection',
  },
  insect_damage: {
    label: 'Insect Damage',
    severity: 'moderate',
    penaltyMultiplier: 0.88,
    description: 'Pest-related holes and marks',
  },
  sunburn: {
    label: 'Sunburn',
    severity: 'moderate',
    penaltyMultiplier: 0.85,
    description: 'Sun-bleached or heat-damaged areas',
  },
  bruising: {
    label: 'Bruising',
    severity: 'minor',
    penaltyMultiplier: 0.93,
    description: 'Dark spots from improper handling',
  },
  foreign_matter: {
    label: 'Foreign Matter',
    severity: 'severe',
    penaltyMultiplier: 0.60,
    description: 'Non-tobacco substances present',
  },
  sand_damage: {
    label: 'Sand Damage',
    severity: 'minor',
    penaltyMultiplier: 0.90,
    description: 'Abrasion from sand/soil contact',
  },
};

// =============================================================================
// GRADE CODE STRUCTURE
// =============================================================================

/**
 * Grade Quality Bands (1-4, with 1 being best)
 */
export type QualityBand = 1 | 2 | 3 | 4;

export const QUALITY_BANDS: Record<QualityBand, {
  label: string;
  class: 'premium' | 'good' | 'standard' | 'low';
  priceMultiplier: number;
}> = {
  1: { label: 'First Quality', class: 'premium', priceMultiplier: 1.00 },
  2: { label: 'Second Quality', class: 'good', priceMultiplier: 0.85 },
  3: { label: 'Third Quality', class: 'standard', priceMultiplier: 0.70 },
  4: { label: 'Fourth Quality', class: 'low', priceMultiplier: 0.50 },
};

/**
 * Full Grade Code Structure
 * Format: [Position][Quality][Color] e.g., L1F, C2R, X3D
 */
export interface TobaccoGradeCode {
  position: LeafPosition;
  qualityBand: QualityBand;
  color: TobaccoColor;
  fullCode: string;
  displayName: string;
  class: 'premium' | 'good' | 'standard' | 'low' | 'rejected';
}

/**
 * Generate a tobacco grade code from parameters
 */
export function generateGradeCode(
  position: LeafPosition,
  qualityBand: QualityBand,
  color: TobaccoColor
): TobaccoGradeCode {
  const posCode = LEAF_POSITIONS[position].code;
  const colorCode = TOBACCO_COLORS[color].code;
  const fullCode = `${posCode}${qualityBand}${colorCode}`;
  
  const posLabel = LEAF_POSITIONS[position].label;
  const qualityLabel = QUALITY_BANDS[qualityBand].label;
  const colorLabel = TOBACCO_COLORS[color].label;
  
  return {
    position,
    qualityBand,
    color,
    fullCode,
    displayName: `${posLabel} - ${qualityLabel} - ${colorLabel}`,
    class: QUALITY_BANDS[qualityBand].class,
  };
}

// =============================================================================
// MOISTURE CONTROL
// =============================================================================

export interface MoistureValidation {
  isValid: boolean;
  status: 'safe' | 'marginal' | 'unsafe' | 'critical';
  message: string;
  requiresReconditioning: boolean;
  gradeEligibility: boolean;
  warningLevel: 'none' | 'caution' | 'warning' | 'block';
}

/**
 * Validate moisture content for a given leaf position
 */
export function validateMoisture(
  moisturePercent: number,
  position: LeafPosition
): MoistureValidation {
  const { moistureRange } = LEAF_POSITIONS[position];
  
  // Critical thresholds
  if (moisturePercent < 8) {
    return {
      isValid: false,
      status: 'critical',
      message: 'CRITICAL: Tobacco is too dry. High fire risk. Cannot grade.',
      requiresReconditioning: true,
      gradeEligibility: false,
      warningLevel: 'block',
    };
  }
  
  if (moisturePercent > 22) {
    return {
      isValid: false,
      status: 'critical',
      message: 'CRITICAL: Moisture too high. Mold risk. Requires immediate drying.',
      requiresReconditioning: true,
      gradeEligibility: false,
      warningLevel: 'block',
    };
  }
  
  // Below acceptable range
  if (moisturePercent < moistureRange.min) {
    return {
      isValid: true,
      status: 'unsafe',
      message: `Moisture ${moisturePercent}% is below minimum ${moistureRange.min}% for ${LEAF_POSITIONS[position].label}. Grade may be penalized.`,
      requiresReconditioning: moisturePercent < moistureRange.min - 2,
      gradeEligibility: true,
      warningLevel: 'warning',
    };
  }
  
  // Above acceptable range
  if (moisturePercent > moistureRange.max) {
    return {
      isValid: true,
      status: 'unsafe',
      message: `Moisture ${moisturePercent}% exceeds maximum ${moistureRange.max}% for ${LEAF_POSITIONS[position].label}. Drying recommended.`,
      requiresReconditioning: moisturePercent > moistureRange.max + 2,
      gradeEligibility: true,
      warningLevel: 'warning',
    };
  }
  
  // Marginal (within range but not ideal)
  const deviation = Math.abs(moisturePercent - moistureRange.ideal);
  if (deviation > 2) {
    return {
      isValid: true,
      status: 'marginal',
      message: `Moisture ${moisturePercent}% acceptable. Ideal is ${moistureRange.ideal}%.`,
      requiresReconditioning: false,
      gradeEligibility: true,
      warningLevel: 'caution',
    };
  }
  
  // Ideal range
  return {
    isValid: true,
    status: 'safe',
    message: `Moisture ${moisturePercent}% is optimal for ${LEAF_POSITIONS[position].label}.`,
    requiresReconditioning: false,
    gradeEligibility: true,
    warningLevel: 'none',
  };
}

// =============================================================================
// PRICE CALCULATION
// =============================================================================

export interface TobaccoPriceBreakdown {
  basePrice: number;
  positionAdjustment: number;
  colorAdjustment: number;
  textureAdjustment: number;
  qualityAdjustment: number;
  moisturePenalty: number;
  defectPenalty: number;
  finalPricePerKg: number;
  totalValue: number;
  currency: string;
  factors: Array<{
    factor: string;
    description: string;
    impact: number; // positive or negative amount
    percentage: number;
  }>;
}

/**
 * Calculate detailed price breakdown for transparency
 */
export function calculateTobaccoPrice(params: {
  basePrice: number;
  position: LeafPosition;
  color: TobaccoColor;
  texture: TobaccoTexture;
  qualityBand: QualityBand;
  moisturePercent: number;
  defectPercent: number;
  weightKg: number;
  currency?: string;
}): TobaccoPriceBreakdown {
  const {
    basePrice,
    position,
    color,
    texture,
    qualityBand,
    moisturePercent,
    defectPercent,
    weightKg,
    currency = 'USD',
  } = params;

  const factors: TobaccoPriceBreakdown['factors'] = [];
  
  // Base price
  let price = basePrice;
  factors.push({
    factor: 'Base Season Price',
    description: 'Starting price per kg for this season',
    impact: basePrice,
    percentage: 100,
  });

  // Position adjustment
  const positionMult = LEAF_POSITIONS[position].priceMultiplier;
  const positionAdj = basePrice * (positionMult - 1);
  price *= positionMult;
  if (positionAdj !== 0) {
    factors.push({
      factor: `${LEAF_POSITIONS[position].label} Position`,
      description: LEAF_POSITIONS[position].description,
      impact: positionAdj,
      percentage: (positionMult - 1) * 100,
    });
  }

  // Color adjustment
  const colorMult = TOBACCO_COLORS[color].priceMultiplier;
  const colorAdj = price * (colorMult - 1);
  const priceAfterColor = price * colorMult;
  if (colorAdj !== 0) {
    factors.push({
      factor: `${TOBACCO_COLORS[color].label} Color`,
      description: TOBACCO_COLORS[color].description,
      impact: colorAdj,
      percentage: (colorMult - 1) * 100,
    });
  }
  price = priceAfterColor;

  // Texture adjustment
  const textureMult = TOBACCO_TEXTURES[texture].priceMultiplier;
  const textureAdj = price * (textureMult - 1);
  const priceAfterTexture = price * textureMult;
  if (textureAdj !== 0) {
    factors.push({
      factor: `${TOBACCO_TEXTURES[texture].label} Body`,
      description: TOBACCO_TEXTURES[texture].description,
      impact: textureAdj,
      percentage: (textureMult - 1) * 100,
    });
  }
  price = priceAfterTexture;

  // Quality band adjustment
  const qualityMult = QUALITY_BANDS[qualityBand].priceMultiplier;
  const qualityAdj = price * (qualityMult - 1);
  const priceAfterQuality = price * qualityMult;
  if (qualityAdj !== 0) {
    factors.push({
      factor: `${QUALITY_BANDS[qualityBand].label}`,
      description: `Grade quality band ${qualityBand}`,
      impact: qualityAdj,
      percentage: (qualityMult - 1) * 100,
    });
  }
  price = priceAfterQuality;

  // Moisture penalty (if outside ideal range)
  const moistureValidation = validateMoisture(moisturePercent, position);
  let moisturePenalty = 0;
  if (moistureValidation.status === 'unsafe') {
    moisturePenalty = price * -0.10;
    price += moisturePenalty;
    factors.push({
      factor: 'Moisture Penalty',
      description: moistureValidation.message,
      impact: moisturePenalty,
      percentage: -10,
    });
  } else if (moistureValidation.status === 'marginal') {
    moisturePenalty = price * -0.03;
    price += moisturePenalty;
    factors.push({
      factor: 'Moisture Adjustment',
      description: moistureValidation.message,
      impact: moisturePenalty,
      percentage: -3,
    });
  }

  // Defect penalty
  let defectPenalty = 0;
  const defectTolerance = LEAF_POSITIONS[position].defectTolerance;
  if (defectPercent > defectTolerance) {
    const excessDefect = defectPercent - defectTolerance;
    const defectPenaltyRate = Math.min(excessDefect * 0.02, 0.30); // Max 30% penalty
    defectPenalty = price * -defectPenaltyRate;
    price += defectPenalty;
    factors.push({
      factor: 'Defect Penalty',
      description: `Defects ${defectPercent}% exceed tolerance of ${defectTolerance}%`,
      impact: defectPenalty,
      percentage: -defectPenaltyRate * 100,
    });
  }

  const finalPrice = Math.max(0, Math.round(price * 100) / 100);
  const totalValue = Math.round(finalPrice * weightKg * 100) / 100;

  return {
    basePrice,
    positionAdjustment: positionAdj,
    colorAdjustment: colorAdj,
    textureAdjustment: textureAdj,
    qualityAdjustment: qualityAdj,
    moisturePenalty,
    defectPenalty,
    finalPricePerKg: finalPrice,
    totalValue,
    currency,
    factors,
  };
}

// =============================================================================
// GRADE ELIGIBILITY RULES
// =============================================================================

export interface GradeEligibilityResult {
  eligible: boolean;
  suggestedQualityBand: QualityBand;
  suggestedClass: 'premium' | 'good' | 'standard' | 'low' | 'rejected';
  reasons: string[];
  warnings: string[];
  blockers: string[];
}

/**
 * Determine grade eligibility based on all parameters
 */
export function checkGradeEligibility(params: {
  position: LeafPosition;
  color: TobaccoColor;
  texture: TobaccoTexture;
  maturity: TobaccoMaturity;
  moisturePercent: number;
  defectPercent: number;
}): GradeEligibilityResult {
  const { position, color, texture, maturity, moisturePercent, defectPercent } = params;
  
  const blockers: string[] = [];
  const warnings: string[] = [];
  const reasons: string[] = [];
  
  let suggestedBand: QualityBand = 1;
  
  // Check moisture
  const moistureCheck = validateMoisture(moisturePercent, position);
  if (moistureCheck.status === 'critical') {
    blockers.push(moistureCheck.message);
  } else if (moistureCheck.status === 'unsafe') {
    warnings.push(moistureCheck.message);
    suggestedBand = Math.max(suggestedBand, 3) as QualityBand;
  } else if (moistureCheck.status === 'marginal') {
    reasons.push(moistureCheck.message);
    suggestedBand = Math.max(suggestedBand, 2) as QualityBand;
  }
  
  // Check defects
  const defectTolerance = LEAF_POSITIONS[position].defectTolerance;
  if (defectPercent >= 25) {
    blockers.push(`Defect rate ${defectPercent}% exceeds rejection threshold of 25%`);
  } else if (defectPercent > defectTolerance) {
    const excess = defectPercent - defectTolerance;
    if (excess > 10) {
      suggestedBand = Math.max(suggestedBand, 4) as QualityBand;
      warnings.push(`Defects ${defectPercent}% significantly exceed tolerance`);
    } else {
      suggestedBand = Math.max(suggestedBand, 3) as QualityBand;
      warnings.push(`Defects ${defectPercent}% above tolerance of ${defectTolerance}%`);
    }
  }
  
  // Check maturity
  const maturityInfo = TOBACCO_MATURITY[maturity];
  if (maturity === 'immature') {
    blockers.push('Immature tobacco cannot be graded');
  } else if (maturity === 'unripe') {
    suggestedBand = Math.max(suggestedBand, 4) as QualityBand;
    warnings.push('Unripe tobacco has limited grade eligibility');
  } else if (maturity === 'overripe') {
    suggestedBand = Math.max(suggestedBand, 2) as QualityBand;
    reasons.push('Over-mature tobacco - lower grade recommended');
  }
  
  // Check color - green is penalty
  if (color === 'green') {
    suggestedBand = Math.max(suggestedBand, 4) as QualityBand;
    warnings.push('Greenish color indicates under-cured tobacco');
  } else if (color === 'brown') {
    suggestedBand = Math.max(suggestedBand, 3) as QualityBand;
    reasons.push('Dark color reduces grade eligibility');
  }
  
  // Check texture
  if (texture === 'papery' || texture === 'coarse') {
    suggestedBand = Math.max(suggestedBand, 3) as QualityBand;
    reasons.push(`${TOBACCO_TEXTURES[texture].label} texture affects burn quality`);
  }
  
  // Premium eligibility requires all optimal
  if (suggestedBand === 1) {
    const isPremiumEligible = 
      (color === 'lemon' || color === 'orange') &&
      texture === 'medium' &&
      (maturity === 'mature' || maturity === 'ripe') &&
      (position === 'leaf' || position === 'cutters');
      
    if (!isPremiumEligible) {
      suggestedBand = 2;
      reasons.push('Combination of factors limits premium eligibility');
    }
  }
  
  const eligible = blockers.length === 0;
  const suggestedClass = eligible 
    ? (blockers.length > 0 ? 'rejected' : QUALITY_BANDS[suggestedBand].class)
    : 'rejected';
  
  return {
    eligible,
    suggestedQualityBand: suggestedBand,
    suggestedClass,
    reasons,
    warnings,
    blockers,
  };
}