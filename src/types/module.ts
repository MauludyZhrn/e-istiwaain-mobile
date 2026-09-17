export type ModuleCategory =
  | 'pendahuluan'
  | 'sejarah'
  | 'metode'
  | 'formula'
  | 'data_referensi'
  | 'sop_lapangan'
  | 'glosarium';

export type DifficultyLevel = 'dasar' | 'menengah' | 'lanjutan';

// Block Types untuk Render Konten Dinamis
export interface TextBlock {
  type: 'paragraph' | 'h2' | 'h3';
  content: string;
}

export interface QuoteBlock {
  type: 'quote';
  text: string;
  source: string;
}

export interface FormulaVariable {
  symbol:  string;
  meaning: string;
  value?: string;
}

export interface FormulaBlock {
  type: 'formula';
  title: string;
  expression: string;
  explanation?: string;
  variables?: FormulaVariable[];
}

export interface IllustrationBlock {
  type: 'illustration';
  caption: string;
  svgType: 'mercator_vs_great_circle' | 'spherical_triangle' | 'gnomon_shadow';
}

export type ContentBlock =
  | TextBlock
  | QuoteBlock
  | FormulaBlock
  | IllustrationBlock;

// Entity Support Types
export interface CityReference {
  cityName: string;
  latitude: number;
  longitude: number;
  formattedLat: string;
  formattedLng: string;
  qiblaAzimuth: number;
  compassDirection: string;
  distanceKm: number;
}

export interface ScholarCard {
  name: string;
  initials: string;
  era: string;
  contribution: string;
}

export interface ChecklistItem {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
}

// Main Interface Modul
export interface KiblatModule {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: ModuleCategory;
  readTimeMinutes: number;
  difficulty: DifficultyLevel;
  iconName: string;
  summary: string;
  blocks: ContentBlock[];
  cityReferences?: CityReference[];
  scholars?: ScholarCard[];
  checklistSOP?: ChecklistItem[];
  references?: string[];
}