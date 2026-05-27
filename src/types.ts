/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VariantQuestion {
  id: string;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  analysis: string; // 易错点分析
}

export interface MistakeRecord {
  id: string;
  title: string;
  imageUrl?: string;
  originalText: string;
  originalOptions?: string[];
  originalCorrectAnswer?: string;
  originalStudentAnswer?: string;
  knowledgePoint: string;
  variants: VariantQuestion[];
  createdAt: string;
}
