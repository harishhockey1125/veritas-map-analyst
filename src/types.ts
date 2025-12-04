export interface SurveyPartition {
  villageName: string;
  partitionId: string;
  surveyNumbers: string[];
  remarks?: string;
}

export interface AnalysisResult {
  partitions: SurveyPartition[];
}
