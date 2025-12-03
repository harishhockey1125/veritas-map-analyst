export enum ModelType {
  FLASH = 'gemini-2.0-flash',
  PRO_REASONING = 'gemini-2.0-flash'
}

export enum AnalysisMode {
  MAP_EXTRACTION = 'Map & Survey Extraction',
  GENERAL = 'General Analysis',
  SUMMARIZE = 'Summarization',
  SENTIMENT = 'Sentiment Analysis',
  PROOFREAD = 'Proofreading & Grammar',
  FACT_CHECK = 'Fact Extraction',
  LOGIC_CHECK = 'Logical Consistency Check',
  CUSTOM = 'Custom Query'
}

export interface AnalysisConfig {
  model: ModelType;
  mode: AnalysisMode;
  thinkingBudget: number; // Only for Pro Reasoning
  customPrompt?: string;
  targetColumns?: string; // Comma-separated list of desired output columns
  extractionInstructions?: string; // Specific user formatting rules
  images?: {
    data: string;
    mimeType: string;
  }[];
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  isThinking?: boolean;
}
