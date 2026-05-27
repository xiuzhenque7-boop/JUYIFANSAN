/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MathTextProps {
  text: string;
}

export function MathText({ text }: MathTextProps) {
  if (!text) return null;

  // 根据 '$' 拆分普通文本与 LaTeX 块
  const parts = text.split('$');

  return (
    <span className="leading-relaxed">
      {parts.map((part, index) => {
        const isMath = index % 2 === 1;
        if (!isMath) {
          // 普通文本
          return <span key={index}>{part}</span>;
        } else {
          // 数学公式或符号片段
          return (
            <span
              key={index}
              className="font-serif italic font-semibold px-1 text-indigo-950 bg-indigo-50/40 rounded border-b border-dashed border-indigo-200 inline-block text-[15px] select-all"
            >
              {renderMath(part)}
            </span>
          );
        }
      })}
    </span>
  );
}

function renderMath(mathStr: string): React.ReactNode {
  // 简易替换 LaTeX 常见符号缩写，供无缝高保真本地渲染
  let processed = mathStr
    .replace(/\\pm/g, '±')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\theta/g, 'θ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\pi/g, 'π')
    .replace(/\\sqrt/g, '√')
    .replace(/\\infty/g, '∞')
    .replace(/\\approx/g, '≈')
    .replace(/\\quad/g, '  ')
    .replace(/\\triangle/g, '△')
    .replace(/\\angle/g, '∠');

  return parseSubSuper(processed);
}

function parseSubSuper(str: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let i = 0;
  while (i < str.length) {
    if (str[i] === '^') {
      i++;
      if (str[i] === '{') {
        const end = str.indexOf('}', i);
        if (end !== -1) {
          tokens.push(<sup key={`sup-${i}`} className="text-[10px] leading-none select-all">{str.substring(i + 1, end)}</sup>);
          i = end + 1;
        } else {
          tokens.push(<sup key={`sup-${i}`} className="text-[10px] leading-none select-all">{str.substring(i)}</sup>);
          break;
        }
      } else {
        tokens.push(<sup key={`sup-${i}`} className="text-[10px] leading-none select-all">{str[i]}</sup>);
        i++;
      }
    } else if (str[i] === '_') {
      i++;
      if (str[i] === '{') {
        const end = str.indexOf('}', i);
        if (end !== -1) {
          tokens.push(<sub key={`sub-${i}`} className="text-[10px] leading-none select-all">{str.substring(i + 1, end)}</sub>);
          i = end + 1;
        } else {
          tokens.push(<sub key={`sub-${i}`} className="text-[10px] leading-none select-all">{str.substring(i)}</sub>);
          break;
        }
      } else {
        tokens.push(<sub key={`sub-${i}`} className="text-[10px] leading-none select-all">{str[i]}</sub>);
        i++;
      }
    } else {
      tokens.push(<span key={`char-${i}`} className="select-all">{str[i]}</span>);
      i++;
    }
  }
  return tokens;
}
