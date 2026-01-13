// Unified theme gradients used across the entire app
// These 4 gradients are the primary color scheme

export const STAT_GRADIENTS = [
  'from-blue-500 to-cyan-400',      // Blue → Cyan
  'from-purple-500 to-pink-400',    // Purple → Pink  
  'from-emerald-500 to-teal-400',   // Emerald → Teal
  'from-orange-500 to-amber-400'    // Orange → Amber
] as const;

// Gradient CSS classes for direct use
export const GRADIENT_BLUE = STAT_GRADIENTS[0];
export const GRADIENT_PURPLE = STAT_GRADIENTS[1];
export const GRADIENT_GREEN = STAT_GRADIENTS[2];
export const GRADIENT_ORANGE = STAT_GRADIENTS[3];

// For components that need index-based access
export const getGradient = (index: number) => STAT_GRADIENTS[index % STAT_GRADIENTS.length];
