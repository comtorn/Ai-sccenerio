export interface LessonPlanWeek {
  weekNumber: number;
  unitName: string;
  topic: string;
  learningObjectives: string;
  keyLaws: string;
  suggestedScenario: string;
  learningActivity: string;
  assessmentMethod: string;
}

export interface Character {
  name: string;
  role: string;
  detail: string;
}

export interface DisputeInfo {
  triggerEvent: string;
  employeeClaim: string;
  employerClaim: string;
}

export interface ApplicableLaw {
  lawName: string;
  article: string;
  contentSummary: string;
  application: string;
}

export interface Verdict {
  conclusion: string;
  reasoning: string;
  legalRemedy: string;
  practicalAdvice: string;
}

export interface RoleplayChoice {
  id: string;
  choiceText: string;
  consequence: string;
  isLegallyCorrect: boolean;
}

export interface StudentActivity {
  instruction: string;
  questions: string[];
  roleplayChoices: RoleplayChoice[];
}

export interface RubricItem {
  criteriaName: string;
  weight: string;
  excellentLevel: string;
  goodLevel: string;
  fairLevel: string;
  needsImprovement: string;
}

export interface Scenario {
  id: string;
  title: string;
  vocationalField: string;
  workplace: string;
  characters: Character[];
  story: string;
  dispute: DisputeInfo;
  keyLegalIssues: string[];
  applicableLaws: ApplicableLaw[];
  verdict: Verdict;
  studentActivity: StudentActivity;
  rubric: RubricItem[];
  createdAt?: string;
  sheetSynced?: boolean;
}

export interface EvaluationResult {
  score: number;
  grade: string;
  verdictAccuracy: string;
  lawApplicationFeedback: string;
  strengths: string[];
  improvements: string[];
  vocationalTip: string;
  encouragement: string;
}

export interface ConnectedSheet {
  id: string;
  title: string;
  url: string;
  tabs: string[];
  lastSyncedAt?: string;
}
