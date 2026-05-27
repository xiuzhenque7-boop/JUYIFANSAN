/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Compass, Award } from 'lucide-react';

export interface SampleQuestion {
  id: string;
  discipline: 'math' | 'english' | 'physics';
  label: string;
  icon: React.ReactNode;
  title: string;
  knowledgePoint: string;
  originalText: string;
  originalOptions: string[];
  originalCorrectAnswer: string;
  originalStudentAnswer: string;
  previewColor: string;
  simulatedImage: string; // Base64 or illustrative SVG placeholder
}

export const EXAM_SAMPLES: SampleQuestion[] = [
  {
    id: 'sample-math',
    discipline: 'math',
    label: '数学: 判别式漏根陷阱',
    icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
    title: '关于k含参一元二次方程根的判别',
    knowledgePoint: '一元二次方程根的判别式',
    originalText: '已知关于 $x$ 的方程 $(k-1)x^2 - 2x + 1 = 0$ 有两个不相等的实数根，求 $k$ 的取值范围。',
    originalOptions: [
      'A. $k < 2$',
      'B. $k < 2$ 且 $k \\neq 1$',
      'C. $k \\le 2$',
      'D. $k \\le 2$ 且 $k \\neq 1$'
    ],
    originalCorrectAnswer: 'B',
    originalStudentAnswer: 'A (漏掉了关于二次项系数 $k-1 \\neq 0$ 的限定条件)',
    previewColor: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    simulatedImage: 'M10 20 L40 80 L70 50 L120 150 L180 30'
  },
  {
    id: 'sample-english',
    discipline: 'english',
    label: '英语: 现在完成时混淆',
    icon: <Compass className="w-4 h-4 text-indigo-600" />,
    title: '现在完成时与一般过去时辨析',
    knowledgePoint: '现在完成时态',
    originalText: 'Great changes ______ in our hometown since the year 2018. It is now much more beautiful.',
    originalOptions: [
      'A. took place',
      'B. have taken place',
      'C. are taking place',
      'D. had taken place'
    ],
    originalCorrectAnswer: 'B',
    originalStudentAnswer: 'A (看到 year 2018 以为是一般过去时，忽略了 since 引导的时间状语表示动作一直延续到现在)',
    previewColor: 'bg-indigo-50 border-indigo-200 text-indigo-950',
    simulatedImage: 'M20 120 C 50 20, 100 150, 180 80'
  },
  {
    id: 'sample-physics',
    discipline: 'physics',
    label: '物理: 电路电阻分压计算',
    icon: <Award className="w-4 h-4 text-purple-600" />,
    title: '滑动变阻器最大分压判定',
    knowledgePoint: '串联分压与欧姆定律',
    originalText: '如图所示电路，电源电压恒为 $U = 6V$。定值电阻 $R_1 = 10\\Omega$，滑动变阻器 $R_2$ 的最大阻值为 $20\\Omega$。当滑动变阻器的滑片P从最右端移动到最左端时，滑动变阻器两端的最大电压值是多少？',
    originalOptions: [],
    originalCorrectAnswer: '4V (定值电阻与变阻器串联分压，当 $R_2 = 20\\Omega$ 达最大阻值时，其分得电压最大。由等压比 $U_2 = \\frac{R_2}{R_1 + R_2} \\times U = \\frac{20}{10+20} \\times 6 = 4V$)',
    originalStudentAnswer: '6V (学生误认为滑动变阻器能够分走电源所有的电压，未考虑串联闭合回路中定值电阻的总分压限制)',
    previewColor: 'bg-purple-50 border-purple-200 text-purple-950',
    simulatedImage: 'M50 100 H80 L90 85 L100 115 L110 85 L120 115 L130 100 H160'
  }
];

interface SamplePromptsProps {
  onSelect: (sample: SampleQuestion) => void;
}

export function SamplePrompts({ onSelect }: SamplePromptsProps) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm transition-all">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
        <h4 className="text-sm font-semibold text-slate-700">演示沙箱：点击一键加载名师错题样例</h4>
      </div>
      <p className="text-xs text-slate-500 mb-3 leading-relaxed">
        如果您手头没有合适试卷图片，可直接点击下方经典学科错题进行模拟 OCR 识别，即可快速体验错题识别、自主修改及大模型「举一反三」的完整教研成果。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {EXAM_SAMPLES.map((sample) => (
          <button
            key={sample.id}
            id={sample.id}
            onClick={() => onSelect(sample)}
            className={`flex items-start gap-3 p-3 text-left rounded-xl border text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-pointer ${sample.previewColor}`}
          >
            <div className="p-1.5 rounded-lg bg-white shadow-sm mt-0.5">
              {sample.icon}
            </div>
            <div>
              <p className="font-semibold text-xs text-slate-800 leading-tight mb-1">{sample.label}</p>
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{sample.title}</p>
              <div className="mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-white rounded-md border border-slate-100 shadow-3xs font-medium text-slate-500">
                考点: {sample.knowledgePoint}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
