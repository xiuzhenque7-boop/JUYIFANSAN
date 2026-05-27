/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Printer, Eye, X, CheckSquare, Square, FileText, Settings, Sparkles } from 'lucide-react';
import { MistakeRecord } from '../types';
import { MathText } from './MathText';

interface PrintPreviewProps {
  selectedRecords: MistakeRecord[];
  onClose: () => void;
}

export function PrintPreview({ selectedRecords, onClose }: PrintPreviewProps) {
  const [includeAnswers, setIncludeAnswers] = useState<boolean>(true);
  const [includeOriginal, setIncludeOriginal] = useState<boolean>(true);
  const [paperTitle, setPaperTitle] = useState<string>("错题智能生成「举一反三」变式特训自测卷");
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  const triggerPrint = () => {
    // 触发浏览器的打印动作。
    // 在打印介质下，CSS 会自动隐藏控制部分并调整为完美纸张版面。
    window.print();
  };

  const hasIssues = selectedRecords.length === 0;

  const fontStyleClass = 
    fontSize === 'sm' ? 'text-sm' : 
    fontSize === 'lg' ? 'text-lg' : 'text-base';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 py-6 px-4 backdrop-blur-xs flex flex-col items-center">
      {/* 顶部悬浮控制台 */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-200 p-4 mb-6 sticky top-0 z-50 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">打印排版系统与 PDF 生成</h3>
            <p className="text-xs text-slate-500">
              已选中 <span className="text-indigo-600 font-semibold">{selectedRecords.length}</span> 道错题。已配置标准化 A4 纸张页面级排版。
            </p>
          </div>
        </div>

        {/* 交互配置区 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 字体调节 */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold mr-2">
            <span className="text-slate-500 px-1.5">字号:</span>
            <button 
              onClick={() => setFontSize('sm')} 
              className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${fontSize === 'sm' ? 'bg-white shadow-3xs text-indigo-600' : 'text-slate-600'}`}
            >
              小
            </button>
            <button 
              onClick={() => setFontSize('base')} 
              className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${fontSize === 'base' ? 'bg-white shadow-3xs text-indigo-600' : 'text-slate-600'}`}
            >
              中
            </button>
            <button 
              onClick={() => setFontSize('lg')} 
              className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${fontSize === 'lg' ? 'bg-white shadow-3xs text-indigo-600' : 'text-slate-600'}`}
            >
              大
            </button>
          </div>

          {/* 开关：包含原错题 */}
          <button
            onClick={() => setIncludeOriginal(!includeOriginal)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-700 bg-white"
          >
            {includeOriginal ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />}
            附带原错题
          </button>

          {/* 开关：打印答案 */}
          <button
            onClick={() => setIncludeAnswers(!includeAnswers)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-700 bg-white"
          >
            {includeAnswers ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />}
            {includeAnswers ? "输出参考答案 (全功能)" : "隐藏参考答案 (适合自测)"}
          </button>

          <button
            onClick={triggerPrint}
            disabled={hasIssues}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 text-xs font-bold rounded-xl shadow-md hover:bg-indigo-700 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            立即打印 / PDF
          </button>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 无法打印提示 */}
      {hasIssues ? (
        <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full border border-slate-100 shadow-sm mt-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h4 className="font-bold text-slate-800 mb-2">未勾选需要打印的题目</h4>
          <p className="text-sm text-slate-500 mb-6">
            请到历史错题本列表中勾选相应的错题卡片，然后点击 “多选并打印” 按钮。
          </p>
          <button
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
          >
            返回错题本
          </button>
        </div>
      ) : (
        <div className="w-full max-w-4xl flex flex-col gap-1 text-slate-500 text-xs mb-2">
          <p className="text-center text-slate-200 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> 
            提示：纸张背景及边缘虚线仅用于网页端对齐预览，打印时会自适应纯白背景与清爽排版。
          </p>
        </div>
      )}

      {/* 打印工作区: 模拟白底 A4 纸视觉效果 */}
      {!hasIssues && (
        <div 
          id="print-area" 
          className="w-full max-w-4xl bg-white border border-slate-300 rounded-xl shadow-2xl p-10 md:p-14 text-slate-900 aspect-[1/1.41] relative flex flex-col"
        >
          {/* 页眉头 */}
          <div className="border-b-2 border-slate-950 pb-4 mb-8">
            <input
              type="text"
              value={paperTitle}
              onChange={(e) => setPaperTitle(e.target.value)}
              className="w-full text-center text-xl md:text-2xl font-bold font-serif border-none focus:outline-none focus:ring-0 text-slate-950 p-1 hover:bg-slate-50 rounded"
              placeholder="请输入试卷主干大标题"
            />
            
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-serif text-slate-700">
              <span>姓名：___________________</span>
              <span>班级：___________________</span>
              <span>学期：2026年季特训</span>
              <span>得分：___________</span>
            </div>
          </div>

          {/* 试卷说明语 */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-8 font-serif leading-relaxed text-slate-600 print:bg-white print:border-none print:p-0">
            <strong>【温馨说明】</strong>
            本测试试卷提取您曾经积累的典型薄弱知识点，经AI特训大模型智能延展其核心性质、变式难度梯度。
            请秉持严谨自省的学习态度，在此练习卷面写出作答思路。自检完后，参考配发卷尾的“易错点大点拨”进行校对纠正。
          </div>

          {/* 题目正文列表 */}
          <div className={`space-y-10 flex-grow ${fontStyleClass}`}>
            {selectedRecords.map((record, index) => (
              <div 
                key={record.id} 
                className="pb-8 border-b border-dashed border-slate-300 print-avoid-break"
              >
                {/* 错题序号与核心考点 */}
                <div className="flex items-center justify-between mb-4 bg-slate-100 p-2 rounded-lg font-serif print:bg-slate-50 print:border">
                  <span className="font-bold text-slate-950 text-sm">
                    第 {index + 1} 大部分：薄弱考点【{record.knowledgePoint}】综合训练
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    错题溯源ID: #{record.id.slice(0, 5)}
                  </span>
                </div>

                {/* 是否输出原错题 */}
                {includeOriginal && (
                  <div className="mb-6 pl-4 border-l-4 border-slate-300">
                    <div className="text-[11px] font-bold tracking-wider text-slate-500 font-serif mb-1">
                      【学情溯源・原错对应母题】
                    </div>
                    <div className="leading-relaxed text-slate-800">
                      <MathText text={record.originalText} />
                    </div>

                    {record.originalOptions && record.originalOptions.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pl-2">
                        {record.originalOptions.map((opt, oId) => (
                          <div key={oId} className="text-slate-700 text-xs font-serif">
                            <MathText text={opt} />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-2.5 flex flex-wrap gap-x-6 text-xs text-slate-500 font-serif">
                      {record.originalStudentAnswer && (
                        <span className="text-rose-700">
                          我的原答: <span className="font-mono bg-rose-50 px-1 rounded border border-rose-100"><MathText text={record.originalStudentAnswer} /></span>
                        </span>
                      )}
                      {record.originalCorrectAnswer && (
                        <span className="text-emerald-700 ml-2">
                          参考母题答案: <span className="font-mono bg-emerald-50 px-1 rounded border border-emerald-100"><MathText text={record.originalCorrectAnswer} /></span>
                        </span>
                      )}
                    </div>

                    {includeAnswers && record.originalAnalysis && (
                      <div className="mt-2.5 pl-3 border-l-2 border-amber-400 text-xs text-slate-700 leading-relaxed font-serif">
                        <span className="font-bold text-amber-900 bg-amber-50 px-1 rounded mr-1">原母题深度解析:</span>
                        <MathText text={record.originalAnalysis} />
                      </div>
                    )}
                  </div>
                )}

                {/* 举一反三变式题目展示 */}
                <div className="mt-4 space-y-8">
                  <div className="text-xs font-bold text-indigo-900 tracking-wider font-serif mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    【大模型智能生成：举一反三强化变式】
                  </div>

                  {record.variants && record.variants.length > 0 ? (
                    record.variants.map((v, vIndex) => (
                      <div key={v.id || vIndex} className="pl-4 border-l-2 border-indigo-100">
                        <div className="font-medium text-slate-900 flex items-start gap-1 font-serif">
                          <span>{index + 1}.{vIndex + 1}</span>
                          <div className="leading-relaxed">
                            <MathText text={v.questionText} />
                          </div>
                        </div>

                        {/* 如果有选择项 */}
                        {v.options && v.options.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pl-4">
                            {v.options.map((opt, optId) => (
                              <div key={optId} className="text-xs text-slate-700 font-serif">
                                <MathText text={opt} />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 为作答题预留手写虚线空间 */}
                        {(!v.options || v.options.length === 0) && (
                          <div className="mt-4 mb-4 pl-4 space-y-2 select-none pointer-events-none opacity-40">
                            <div className="border-b border-dashed border-slate-300 w-full h-4" />
                            <div className="border-b border-dashed border-slate-300 w-full h-4" />
                          </div>
                        )}

                        {/* 答案与易错精审部分 */}
                        {includeAnswers && (
                          <div className="mt-3 ml-4 p-3 bg-amber-50/50 rounded-lg border border-amber-100/70 font-serif text-xs print:bg-amber-50/25 print:border-slate-200">
                            <div className="font-bold text-amber-900 flex items-center gap-1 mb-1">
                              <span>正确答案：</span>
                              <span className="text-emerald-800 font-mono bg-emerald-50 px-1 rounded border border-emerald-100">
                                <MathText text={v.correctAnswer} />
                              </span>
                            </div>
                            <div className="text-slate-700 leading-relaxed mt-1">
                              <span className="font-semibold text-rose-800 bg-rose-50 px-1 rounded">※ 易错解析点评：</span>
                              {/* 高亮易错点 */}
                              <span className="text-slate-800 font-medium">
                                <MathText text={v.analysis} />
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs italic text-slate-400 pl-4">该错题尚未生成与之匹配的举一反三题目...</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 页码与落款 */}
          <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-serif flex items-center justify-between">
            <span>Powered by 错题举一反三打印机 (AI Studio)</span>
            <span>自测试卷共 1 页，纸张 A4 标准排版 </span>
            <span>学无止境・常错常新</span>
          </div>
        </div>
      )}

      {/* 嵌入打印样态的 CSS Style Tag */}
      <style>{`
        @media print {
          /* 彻底隐藏非实体纸张部分的页面控件 */
          body {
            background-color: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* 屏蔽外部多余元素 */
          div:not(#print-area):not(#print-area *) {
            display: none !important;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0px !important;
            margin: 0px !important;
          }
          /* 避免图片、卡片分页在中间斩断 */
          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* 强制分页边界 */
          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>
    </div>
  );
}
