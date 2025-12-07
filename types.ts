export interface BrandStyle {
  brandName: string;
  themeDescription: string;
  dominantColors: string[];
  fontStyle: string;
  layoutVibe: string;
}

export interface ColorMetrics {
  hex: string;
  contrastWhite: number;
  contrastBlack: number;
  accessibility: string;
}

export interface GeneratedAsset {
  id: string;
  type: 'logo' | 'social';
  subtype: string; // e.g., 'minimalist', 'instagram'
  imageUrl: string;
  description: string;
}

export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'generating' | 'complete' | 'error';
  message?: string;
}