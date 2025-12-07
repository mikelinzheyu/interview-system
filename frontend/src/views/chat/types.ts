export enum MistakeType {
  KNOWLEDGE_GAP = '知识点错误',
  LOGIC_CONFUSION = '逻辑混乱',
  INCOMPLETE = '回答不完整',
  EXPRESSION = '表达不流畅',
}

export enum SourceType {
  FRONTEND_INTERVIEW = '前端开发工程师面试 (AI)',
  FULLSTACK_INTERVIEW = '全栈工程师面试 (AI)',
  BACKEND_INTERVIEW = '后端工程师面试 (AI)',
  QUESTION_BANK = '题库练习',
  MOCK_EXAM = '模拟考试'
}

export interface MistakeItem {
  id: string;
  question: string;
  snippet: string;
  type: MistakeType;
  source: SourceType;
  tags: string[];
  mistakeCount: number;
  mastery: number; // 0 to 100
  lastReviewed: string;
  isFavorite?: boolean;
  isIgnored?: boolean;
}

export interface FilterState {
  search: string;
  selectedSources: SourceType[];
  selectedTypes: MistakeType[];
  selectedTags: string[];
  showFavorites: boolean;
  showIgnored: boolean;
}

export interface ReviewBatch {
  id: string;
  name: string;
  mistakeIds: string[];
  createdAt: string;
}
