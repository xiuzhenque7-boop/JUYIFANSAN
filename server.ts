/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// 增加 JSON 的 Payload 限制（主要防止拍照上传 base64 图像大小超限）
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 初始化 GoogleGenAI 客户端
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("警告：GEMINI_API_KEY 环境变量未设置！智能识别与举一反三生成服务将不可用。");
}

function getAiClient(): GoogleGenAI {
  if (!ai) {
    throw new Error("API_KEY_MISSING: Gemini API_KEY 未设置。请检查「Settings > Secrets」并正确配置。");
  }
  return ai;
}

// 错题 OCR 以及核心知识点识别 API
app.post("/api/analyze-image", async (req, res) => {
  try {
    const { imageB64, mimeType } = req.body;
    if (!imageB64) {
      return res.status(400).json({ error: "未接收到图片数据，请重新上传！" });
    }

    const aiClient = getAiClient();

    // 图像部分的载荷构造
    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: imageB64,
      },
    };

    const textPart = {
      text: `你是一个教研大师及智能错题本识别系统。请高精度提取该错题图片的文本。
要求：
1. 提取出原错题的完整正文内容。遇到数学公式或者常见理科符号，一律用简洁优雅的 LaTeX 语法包裹（例如用 $x^2 + y^2 = 1$）。
2. 如题中有明显的 A、B、C、D 等选项，请把选项分别单独提取并存入“originalOptions”数组。如果没有选项，原题属于填空题、作答题、计算题等，则“originalOptions”请填空数组。
3. 自动给出此题的『标准正确答案』以及推算结论。
4. 敏锐识别或推断图像上学生手写的、留白勾选的『学生原答案』或历史解题笔迹。如果没有，则填空字符串。
5. 针对这个错题归属的基础考点，提炼出一个高大上且学科专业的、不超过12字的核心知识点名称（如“一元二次方程根的判别式”、“现在完成时”、“动量守恒定理与弹簧碰撞”等）。
6. 精炼出一个极简生动的标题（15字以内，如“分式解法易漏判别”）。

请务必强制以 JSON 格式输出，务必满足提供的 responseSchema。不要在外面套 markdown 包裹字。`,
    };

    const ocrSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "错题卡片的拟定好标题" },
        originalText: { type: Type.STRING, description: "高精度OCR提取恢复出的完整题目文字。数学公式使用LaTeX。行文排版清晰。" },
        originalOptions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "选择题选项的各字符串成员（例如: ['A. Option1', 'B. Option2'...]）。如果是非选择题请返回空数组 []"
        },
        originalCorrectAnswer: { type: Type.STRING, description: "该题标准的唯一正确答案，或者包含解答步骤缩影" },
        originalStudentAnswer: { type: Type.STRING, description: "识别原题上手写或明显的涂抹写下的原答案痕迹，无法判断时返回空字符串" },
        knowledgePoint: { type: Type.STRING, description: "该错题最为核心的一个标准学科具体考点（不超过12字）" }
      },
      required: ["title", "originalText", "knowledgePoint"]
    };

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: ocrSchema,
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error analyzing image via Gemini:", error);
    res.status(500).json({ error: error.message || "错题智能图像识别失败，请点击手动编辑输入。" });
  }
});

// 举一反三生成相似题目 API
app.post("/api/generate-variants", async (req, res) => {
  try {
    const { originalText, knowledgePoint, originalOptions } = req.body;
    if (!originalText || !knowledgePoint) {
      return res.status(400).json({ error: "由于缺少原错题正文或核心考点，无法智力生成相似练习题。" });
    }

    const aiClient = getAiClient();

    const formattedOptions = originalOptions && originalOptions.length > 0 
      ? `\n【原题选项】：\n${originalOptions.map((o: string) => '- ' + o).join('\n')}` 
      : '';

    const promptText = `你是一个资深理科与文科教研专家，擅长中高考、基础教育学科设计。
已知原错题内容：
${originalText}${formattedOptions}

核心关联知识点为：【${knowledgePoint}】。

现在需要你针对【${knowledgePoint}】这个核心考点，智能设计并输出 3 道具有高代表性的、与原题难度基本对标、或略带有一点递进梯度且考察同个考点的「举一反三」变式题训练。

具体设计准则：
1. 请更改场景、换改数学数值或换词叙事。绝不能原封不动照抄原题。
2. 对于选择题和非选择题：
   - 如果原题是选择题，建议生成的变式也为选择题（请提供4个干扰项分立至 option 数组），且各选项设计具有强迷惑性。
   - 如果原题是解答、填空、作答或计算题，变式题也可以只出非选择题，此时 options 设为空数组。
3. 必须提供精准客观的【正确最佳答案】。
4. **最核心的要求**：给出的『analysis（易错解析）』一定要切中致命细节、直击学生认知陷阱！
   - 需要分析“为什么学生会在这类变式题犯错”、“在什么地方容易混淆”以及“需要特别防备哪些隐藏条件”。
5. 题目文字及科学计算，对于数学/物理公式符号，请用 LaTeX $包裹起来（例如 $f(x) = ax^2 + bx$），以确保公式在页面端完美排版渲染。

请务必严格以规范的 JSON Array (含有3个变式对象) 形式返回。`;

    const variantsSchema = {
      type: Type.ARRAY,
      description: "包含3道生成的高级变式相似题数组",
      items: {
        type: Type.OBJECT,
        properties: {
          questionText: { type: Type.STRING, description: "变式题目的详细内容。数学公式公式使用LaTeX。行文排版清晰。" },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "若设计为选择题，请在这里摆入 4 个选项（如 A... B...），若是不需要选项的填空/解答等题，请返回空数组 []"
          },
          correctAnswer: { type: Type.STRING, description: "本变式题的正确答案及必要简要公式步骤。公式请采用 LaTeX 包裹。" },
          analysis: { type: Type.STRING, description: "针对这道举一反三变式题的专门『易错分析』，说明解题误区和陷阱所在。不少于50字。" }
        },
        required: ["questionText", "correctAnswer", "analysis"]
      }
    };

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: variantsSchema,
      }
    });

    const resultText = response.text || "[]";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error generating variants via Gemini:", error);
    res.status(500).json({ error: error.message || "智能伴学变式题生成失败，请稍后重新点击！" });
  }
});

// 绑定 Vite 服务中间件或静态提供
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[DEV ENVIRONMENT] Vite development server middleware initialized successfully on Port 3000.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[PRODUCTION ENVIRONMENT] Static resource directory 'dist' has been mapped accurately.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express dev-server binds core port ${PORT} efficiently.`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
