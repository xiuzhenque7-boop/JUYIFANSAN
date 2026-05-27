/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  BookOpen, 
  Trash2, 
  Printer, 
  Edit3, 
  Save, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Plus, 
  X, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  BookMarked,
  Layers,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MistakeRecord, VariantQuestion } from './types';
import { MathText } from './components/MathText';
import { PrintPreview } from './components/PrintPreview';
import { SamplePrompts, EXAM_SAMPLES, SampleQuestion } from './components/SamplePrompts';

// 初始本地存储键名
const LOCAL_STORAGE_KEY = 'mistake_printer_records';

export default function App() {
  // 核心状态管理
  const [activeTab, setActiveTab] = useState<'scan' | 'notebook'>('scan');
  const [records, setRecords] = useState<MistakeRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);

  // 错题识别页状态
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/png");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>("正在初始化图像解析...");
  
  // OCR 识别修改对照区
  const [editTitle, setEditTitle] = useState<string>("");
  const [editText, setEditText] = useState<string>("");
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState<string>("");
  const [editStudentAnswer, setEditStudentAnswer] = useState<string>("");
  const [editAnalysis, setEditAnalysis] = useState<string>("");
  const [editKnowledgePoint, setEditKnowledgePoint] = useState<string>("");
  const [isEditingOcr, setIsEditingOcr] = useState<boolean>(false);
  const [hasRecognized, setHasRecognized] = useState<boolean>(false);

  // 举一反三生成态状态
  const [variants, setVariants] = useState<VariantQuestion[]>([]);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState<boolean>(false);
  
  // 展开某错题本详情的状态
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // 网页端原生相机控制
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 本地存储读写
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setRecords(JSON.parse(stored));
      } else {
        // 当冷启动错题本为空时，默认导入一个经典样例作为引导，让页不显空洞
        const defaultRecord: MistakeRecord = {
          id: 'guide-sample-id',
          title: '一元二次方程k根系数判别',
          knowledgePoint: '一元二次方程根的判别式',
          originalText: '已知关于 $x$ 的方程 $(k-1)x^2 - 2x + 1 = 0$ 有两个不相等的实数根，求 $k$ 的取值范围。',
          originalOptions: [
            'A. $k < 2$',
            'B. $k < 2$ 且 $k \\neq 1$',
            'C. $k \\le 2$',
            'D. $k \\le 2$ 且 $k \\neq 1$'
          ],
          originalCorrectAnswer: 'B',
          originalStudentAnswer: 'A (漏掉了二次项系数非零前提)',
          originalAnalysis: '本题属于极其高频的“含字母二次项系数”经典陷阱题。很多同学仅凭公式定理顺手列出判别式 $\\Delta = (-2)^2 - 4(k-1) > 0 \\implies k < 2$，从而误选 A。然而由于一元二次方程中二次项最高次前含有变参限值，$k-1 \\neq 0 \\implies k \\neq 1$，因此必须复合求交，最终的取值范围为 $k < 2$ 且 $k \\neq 1$。',
          variants: [
            {
              id: 'v-1',
              questionText: '已知关于 $y$ 的方程 $(m+2)y^2 + 4y + 2 = 0$ 满足有两个大于负一的相异实数根，求参 $m$ 的界限。',
              options: ['A. $m < 0$', 'B. $m < 0$ 且 $m \\neq -2$', 'C. $m \\le 0$', 'D. $m \\le 0$ 且 $m \\neq -2$'],
              correctAnswer: 'B (根据判别式 $\\Delta = 16 - 8(m+2) > 0 \\implies m < 0$，同时二次项系数最高次不为零 $m+2 \\neq 0 \\implies m \\neq -2$。)',
              analysis: '本题属于典型的最高项系数含参的方程，极其容易忽略二次项最高项的系数不能等于0。一旦漏掉 $m \\neq -2$，直接导致答案错误。'
            },
            {
              id: 'v-2',
              questionText: '如果关于 $x$ 的一元二次方程 $ax^2 + 2x - 1 = 0$ 有两个不同的实根，若 $a$ 为整数，求 $a$ 的最小值。',
              correctAnswer: '$a = -1$ (因为 $\\Delta = 4 + 4a > 0 \\implies a > -1$。同时由于是一元二次方程，$a \\neq 0$。故满足条件的整数 $a$ 最小值为除 0 以外的最小整数，若 $a > -1$ 则其整数可为 $0, 1, 2...$。等等，本题由于 $a \\neq 0$ 且 $a > -1$，所以最小的非零整数 $a$ 应当是 $1$。)',
              analysis: '本变式题巧妙设问。学生若求解 $\\Delta > 0$ 得到 $a > -1$，判定最小整数时极易漏掉 $a \\neq 0$ 的硬约束进而误答 $a = 0$。'
            },
            {
              id: 'v-3',
              questionText: '定义新运算 $\\oplus$ 满足 $a \\oplus b = ab^2 - a$。若关于 $x$ 的方程 $p \\oplus x - 2x + 1 = 0$ 有两个相异的实数解，求 $p$ 的约束。',
              correctAnswer: '$p > -1$ 且 $p \\neq 0$',
              analysis: '本变式题采用抽象新运算。换算后方程即为 $px^2 - 2x + (1-p) = 0$ 形式，依然要高度小心最高次前含参 $p \\neq 0$ 以及判别式判根的二重考核陷阱。'
            }
          ],
          createdAt: new Date().toISOString()
        };
        setRecords([defaultRecord]);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([defaultRecord]));
      }
    } catch (e) {
      console.error("加载本地存储错误", e);
    }
  }, []);

  const saveRecordsToLocalStorage = (newRecords: MistakeRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newRecords));
  };

  // 拍照与从相册选择本地图片相关
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageB64(result);
      // 自动触发识别
      triggerOcrAnalysis(result, file.type);
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop
  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  // 演示沙箱点击一键识别
  const handleSelectSample = (sample: SampleQuestion) => {
    // 模拟精美手绘或卷子图片视觉效果
    setImageB64("simulated_" + sample.discipline);
    setEditTitle(sample.title);
    setEditKnowledgePoint(sample.knowledgePoint);
    setEditText(sample.originalText);
    setEditOptions(sample.originalOptions);
    setEditCorrectAnswer(sample.originalCorrectAnswer);
    setEditStudentAnswer(sample.originalStudentAnswer);
    setEditAnalysis(sample.originalAnalysis);
    setHasRecognized(true);
    setVariants([]); // 重新选择时清空之前的变式
  };

  // 原生摄像头流启动
  const startCamera = async () => {
    setShowCamera(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // 默认后置变焦摄像头，适合学生拍卷子
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("无法启动相机拍摄:", err);
      setCameraError("请检查您是否拒绝、未授权设备摄像头，或者该浏览器暂不支持直接开启相机拍摄。操作提示：您仍然可以点击「选择本地相册」来进行无缝扫描。");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const b64Data = canvas.toDataURL('image/png');
        setImageB64(b64Data);
        setImageMime("image/png");
        stopCamera();
        // 自动触发大模型智能OCR解析
        triggerOcrAnalysis(b64Data, "image/png");
      }
    }
  };

  // 触发大模型 OCR 分析接口
  const triggerOcrAnalysis = async (base64String: string, mime: string) => {
    setIsAnalyzing(true);
    setHasRecognized(false);
    setVariants([]);
    
    // 旋转加载提示语
    const steps = [
      "正在调优输入图像并进行降噪压缩...",
      "正在调取 Gemini OCR 高精度全科识别通道...",
      "正在析取公式、题意和可能勾选项...",
      "正在结合知识体系研判该题的最佳核心考点..."
    ];
    let stepIdx = 0;
    setAnalysisStep(steps[0]);
    const timer = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setAnalysisStep(steps[stepIdx]);
      }
    }, 1200);

    try {
      // 截断 base64 前面的 "data:image/xxx;base64,"
      const cleanB64 = base64String.includes('base64,') 
        ? base64String.split('base64,')[1] 
        : base64String;

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageB64: cleanB64,
          mimeType: mime
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "识别超时或接口报错");
      }

      const data = await response.json();
      setEditTitle(data.title || "自定义自动识别题目");
      setEditKnowledgePoint(data.knowledgePoint || "未标定具体核心考点");
      setEditText(data.originalText || "");
      setEditOptions(data.originalOptions || []);
      setEditCorrectAnswer(data.originalCorrectAnswer || "");
      setEditStudentAnswer(data.originalStudentAnswer || "");
      setEditAnalysis(data.originalAnalysis || "");
      setHasRecognized(true);
    } catch (err: any) {
      console.error(err);
      alert("智能识别故障: " + err.message + "\n\n您可以点击沙箱示例一键体验，或在下方手动补充创建错题记录。");
      // 容错：允许手动填写
      setEditTitle("手动录入的新错题");
      setEditKnowledgePoint("一元二次方程根的判别式");
      setEditText("已知关于 $x$ 的方程 $(k-1)x^2 - 2x + 1 = 0$ 有两个不相等的实数根，求 $k$ 的取值范围。");
      setEditOptions(['A. $k < 2$', 'B. $k < 2$ 且 $k \\neq 1$']);
      setEditCorrectAnswer("B");
      setEditStudentAnswer("A");
      setEditAnalysis("本题的核心考点是【一元二次方程根的判别式】加上二次项前方含字母必须非零的硬性限定条件。首先由判别式 $\\Delta > 0$ 算出范围为 $k < 2$；再次因为方程含有两个不相等的实数根，必须确保二次项系数 $k-1 \\neq 0 \\implies k \\neq 1$。复合求交即可得出正确答案 $k < 2$ 且 $k \\neq 1$。");
      setHasRecognized(true);
    } finally {
      clearInterval(timer);
      setIsAnalyzing(false);
    }
  };

  // 智取举一反三变式
  const generateThreeVariants = async () => {
    if (!editText || !editKnowledgePoint) {
      alert("请补充原题文字描述，或者确保考点非空。");
      return;
    }

    setIsGeneratingVariants(true);
    try {
      const response = await fetch('/api/generate-variants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalText: editText,
          knowledgePoint: editKnowledgePoint,
          originalOptions: editOptions
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "大模型思考时出溜，生成变式失败");
      }

      const val = await response.json();
      // 赋予随机 id 辅助渲染
      const list = val.map((item: any, idx: number) => ({
        ...item,
        id: `gen-var-${idx}-${Date.now()}`
      }));
      setVariants(list);
    } catch (err: any) {
      console.error(err);
      alert("变式生成异常: " + err.message);
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  // 保存当前的变式和原错题至本地错题本
  const saveToMistakeBook = () => {
    if (!editText) {
      alert("请至少在原错题框里录入题目后再执行保存！");
      return;
    }

    const newRecord: MistakeRecord = {
      id: `record-${Date.now()}`,
      title: editTitle.trim() || '未分类智能错题',
      knowledgePoint: editKnowledgePoint.trim() || '全科通用考点',
      originalText: editText,
      originalOptions: editOptions,
      originalCorrectAnswer: editCorrectAnswer,
      originalStudentAnswer: editStudentAnswer,
      originalAnalysis: editAnalysis,
      variants: variants, // 如果没有生成，则为空数组，在详情页也可以再次触发生成！
      createdAt: new Date().toISOString()
    };

    const updated = [newRecord, ...records];
    saveRecordsToLocalStorage(updated);
    
    // 清空当前编辑区并友好弹窗
    alert(`《${newRecord.title}》已成功归档到您的专属错题本之中！共绑定其 ${variants.length} 道智能高保真变式练习。`);
    
    // 跳转到错题本列表，让用户能直观看到新保存卡片
    setActiveTab('notebook');
    // 默认展开新保存的
    setExpandedRecordId(newRecord.id);
  };

  // 错题本页：选择逻辑
  const handleToggleSelectRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止向下传递至卡片折叠
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === records.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map(r => r.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      alert("您还没有勾选任何错题卡片，无法进行批量删除。");
      return;
    }
    if (confirm(`确定要彻底删除已勾选的 ${selectedIds.length} 项错题记录吗？此操作无法撤销。`)) {
      const remaining = records.filter(r => !selectedIds.includes(r.id));
      saveRecordsToLocalStorage(remaining);
      setSelectedIds([]);
      alert("已安全清理所选错题数据。");
    }
  };

  // 交互式添加空选项或修改选项
  const handleUpdateOption = (index: number, val: string) => {
    const next = [...editOptions];
    next[index] = val;
    setEditOptions(next);
  };

  const handleAddOption = () => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const nextLabel = letters[editOptions.length] || 'X';
    setEditOptions([...editOptions, `${nextLabel}. `]);
  };

  const handleRemoveOption = (index: number) => {
    setEditOptions(editOptions.filter((_, idx) => idx !== index));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans select-none antialiased">
      {/* 顶部通栏导航 */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm shadow-sm select-none">+1</div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            错题举一反三打印机 <span className="text-xs font-normal text-slate-400 ml-2">v2.0</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="hidden sm:inline-block bg-slate-100 text-slate-600 px-3 py-1 bg-white border border-slate-300 rounded-md hover:bg-slate-50 font-sans">
            教师极客端
          </span>
          <div id="system-time" className="font-mono text-slate-400 hidden sm:block">
            Server UTC: 2026-05-27
          </div>
        </div>
      </header>

      {/* 主屏区域 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'scan' ? (
            <motion.div
              key="scan-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* 高阶沙箱预制卡片 */}
              <SamplePrompts onSelect={handleSelectSample} />

              {/* 第一板块：拍照与上传识别 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 左边：智能图片抓放端 */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`bg-white rounded-xl border border-slate-200 p-6 text-center flex flex-col items-center justify-center min-h-[300px] transition-all relative shadow-sm ${
                      isDragging 
                        ? 'border-blue-500 bg-blue-50/50 scale-[0.98]' 
                        : imageB64 
                          ? 'border-dashed border-blue-250 hover:border-blue-450' 
                          : 'border-dashed border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {/* 直接相机覆盖 */}
                    {showCamera ? (
                      <div className="absolute inset-0 bg-slate-950 rounded-xl overflow-hidden flex flex-col justify-between p-3 z-20">
                        <video 
                          ref={videoRef} 
                          className="w-full h-full object-cover rounded-lg bg-slate-900" 
                          playsInline 
                          muted 
                        />
                        {cameraError ? (
                          <div className="absolute inset-x-4 top-12 bg-white/95 backdrop-blur-md p-3 rounded-lg text-rose-700 text-xs shadow-lg leading-relaxed">
                            <span className="font-bold flex items-center gap-1 mb-1"><AlertCircle className="w-4 h-4" /> 错误提示：</span>
                            {cameraError}
                          </div>
                        ) : null}
                        <div className="flex items-center justify-center gap-4 z-10 w-full mb-2">
                          <button
                            onClick={captureSnapshot}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg scale-110 cursor-pointer transition-transform hover:scale-125"
                          >
                            <Camera className="w-5 h-5" />
                          </button>
                          <button
                            onClick={stopCamera}
                            className="bg-white/20 hover:bg-white/30 text-white/90 text-xs px-4 py-2 rounded-full cursor-pointer hover:text-white"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {imageB64 ? (
                      <div className="w-full flex flex-col items-center gap-4">
                        {imageB64.startsWith("simulated_") ? (
                          <div className="w-full h-40 rounded-lg bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                            <div className="absolute inset-0 bg-linear-to-b from-blue-500/5 to-transparent pointer-events-none" />
                            <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shadow-3xs">
                              <Sparkles className="w-5 h-5 animate-pulse" />
                            </div>
                            <span className="text-xs font-semibold text-slate-800 tracking-wider">
                              {imageB64 === "simulated_math" ? "数学典型试卷公式模拟加载" : 
                               imageB64 === "simulated_english" ? "英语重点短语测试模拟加载" : "初中物理分压测算模拟加载"}
                            </span>
                          </div>
                        ) : (
                          <div className="relative group w-full max-h-[220px] rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                            <img 
                              src={imageB64} 
                              alt="Uploaded question" 
                              className="w-full h-full object-contain max-h-[220px]" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              {/* 重新识别按钮 */}
                              <button
                                onClick={() => triggerOcrAnalysis(imageB64, imageMime)}
                                className="bg-white hover:bg-blue-50 text-blue-600 p-2 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-4 h-4" /> 重新识别
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="w-full space-y-2">
                          <p className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 纸张载体获取完成
                          </p>
                          <div className="flex items-center gap-2 justify-center">
                            <button
                              onClick={startCamera}
                              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" /> 重新重调
                            </button>
                            <label className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer">
                              <ImageIcon className="w-3.5 h-3.5" /> 本地重换
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                                className="hidden" 
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                          <Camera className="w-6 h-6 animate-pulse" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1">拍照抓取 或 点击拖入大图</h4>
                        <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed mb-6">
                          支持试卷原错题拍照；支持全科英文、物理公式、数学 LaTeX 排版
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs">
                          <button
                            onClick={startCamera}
                            className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-sm cursor-pointer transition-transform active:scale-95"
                          >
                            <Camera className="w-4 h-4" /> 开启相机拍照
                          </button>
                          
                          <label className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs py-2 px-3 rounded-lg cursor-pointer transition-transform active:scale-95">
                            <ImageIcon className="w-4 h-4 text-slate-500" /> 选择本地图片
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleFileChange} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 引导说明 */}
                  <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-lg p-4 text-xs space-y-2 shadow-sm">
                    <p className="font-bold flex items-center gap-1 text-white"><HelpCircle className="w-3.5 h-3.5 text-blue-400" /> 错题举一反三特训三部曲：</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-0.5">
                      <li><strong>上传错题</strong>：可以点击我们的名师沙箱一键载入测试，或者直接用本手机摄像头极速扫描。</li>
                      <li><strong>精准修正</strong>：大语言模型高精度 OCR 会分析题目及考点。可在右侧对识别出的公式细节任意调整。</li>
                      <li><strong>变式特训</strong>：点击“生成变式”即可调取 Gemini 模型深度思考推演 3 道相似梯度考题。</li>
                    </ol>
                  </div>
                </div>

                {/* 右边：智能 OCR 识别信息 + 细调区 */}
                <div className="lg:col-span-8 space-y-4">
                  
                  {isAnalyzing ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center gap-4">
                      <div className="relative flex items-center justify-center h-16 w-16">
                        <div className="absolute animate-ping h-8 w-8 rounded-full bg-blue-400 opacity-75" />
                        <div className="rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent animate-spin" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-base">高级教研大模型正在全感知识别...</h4>
                      <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-semibold border border-blue-100">
                        {analysisStep}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm leading-relaxed mt-2">
                        正在为本题的 LaTeX 科学符号、手写修改笔锋进行降噪对准，请稳步等待几秒时间。
                      </p>
                    </div>
                  ) : hasRecognized ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                      <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">原始错题内容 (OCR)</span>
                        <button
                          onClick={() => setIsEditingOcr(!isEditingOcr)}
                          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {isEditingOcr ? "锁定当前并预览" : "我要手动编辑修正"}
                        </button>
                      </div>

                      <div className="p-6 space-y-5">
                        {/* 题目内容展示 / 编辑区 */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">错题个性化标题 (Title)</label>
                              {isEditingOcr ? (
                                <input 
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:border-blue-500 focus:ring-0 focus:outline-none"
                                />
                              ) : (
                                <p className="text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">{editTitle || "无标题"}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">提炼核心知识点 (核心考点标签)</label>
                              {isEditingOcr ? (
                                <input 
                                  type="text"
                                  value={editKnowledgePoint}
                                  onChange={(e) => setEditKnowledgePoint(e.target.value)}
                                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-blue-700 focus:border-blue-500 focus:ring-0 focus:outline-none"
                                />
                              ) : (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                  <div className="text-[10px] text-blue-500 font-bold mb-1">核心知识点</div>
                                  <div className="text-sm font-bold text-blue-900">{editKnowledgePoint || "未标定考点"}</div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">原错题题干正文 (支持标准 $ 包裹数学公式)</label>
                            {isEditingOcr ? (
                              <textarea
                                rows={4}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 focus:border-blue-500 focus:ring-0 focus:outline-none"
                              />
                            ) : (
                              <div className="text-sm leading-relaxed text-slate-700 bg-slate-50 p-3 rounded border border-slate-100">
                                <p className="font-medium mb-1 text-slate-400 uppercase text-[10px]">[原题内容]</p>
                                <MathText text={editText} />
                              </div>
                            )}
                          </div>

                          {/* 选择题型子选项 */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-500">选择题子选项（非选择题保留为空）</label>
                              {isEditingOcr && (
                                <button
                                  onClick={handleAddOption}
                                  className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" /> 添加选项
                                </button>
                              )}
                            </div>

                            {(editOptions && editOptions.length > 0) ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {editOptions.map((opt, oIdx) => (
                                  <div key={oIdx} className="flex items-center gap-2">
                                    {isEditingOcr ? (
                                      <div className="flex items-center gap-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-1">
                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={(e) => handleUpdateOption(oIdx, e.target.value)}
                                          className="w-full text-xs font-mono bg-transparent border-none p-1 focus:ring-0 focus:outline-none"
                                        />
                                        <button 
                                          onClick={() => handleRemoveOption(oIdx)}
                                          className="p-1 text-slate-400 hover:text-rose-600"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="w-full text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-serif">
                                        <MathText text={opt} />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs italic text-slate-400">目前判定为填空或综合大题（即非选择题变式原型）</p>
                            )}
                          </div>

                          {/* 我的答案与标准参考答案 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                            <div>
                              <p className="font-medium mb-1 text-slate-400 uppercase text-[10px]">用户答案</p>
                              {isEditingOcr ? (
                                <input 
                                  type="text"
                                  value={editStudentAnswer}
                                  onChange={(e) => setEditStudentAnswer(e.target.value)}
                                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:border-blue-500 focus:ring-0 focus:outline-none text-rose-700"
                                />
                              ) : (
                                <p className="text-sm leading-relaxed text-slate-700">
                                  {editStudentAnswer ? <span className="line-through text-slate-400"><MathText text={editStudentAnswer} /></span> : "未识别到学生手写原答"}
                                </p>
                              )}
                            </div>
                            
                            <div>
                              <p className="font-medium mb-1 text-slate-400 uppercase text-[10px]">参考最佳答案</p>
                              {isEditingOcr ? (
                                <input 
                                  type="text"
                                  value={editCorrectAnswer}
                                  onChange={(e) => setEditCorrectAnswer(e.target.value)}
                                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:border-blue-500 focus:ring-0 focus:outline-none text-emerald-800"
                                />
                              ) : (
                                <p className="text-sm font-medium text-emerald-700 bg-emerald-50/50 p-2.5 rounded border border-emerald-100/70">
                                  {editCorrectAnswer ? <MathText text={editCorrectAnswer} /> : "未定标准答案"}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* 错题详细生动深度解析区 */}
                          <div className="pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              <p className="font-bold text-xs text-amber-950">名师原题深度解析 & 避坑指南</p>
                            </div>
                            {isEditingOcr ? (
                              <textarea
                                value={editAnalysis}
                                onChange={(e) => setEditAnalysis(e.target.value)}
                                rows={4}
                                placeholder="请输入该错题的详细深度解析、出错逻辑分析，支持使用 LaTeX $包裹公式..."
                                className="w-full text-xs font-serif bg-slate-50 border border-slate-200 rounded-lg p-3 focus:border-blue-500 focus:ring-0 focus:outline-none text-slate-800 leading-relaxed"
                              />
                            ) : (
                              <div className="text-xs text-slate-800 bg-amber-50/40 p-3 rounded-lg border border-amber-100/60 leading-relaxed font-serif">
                                {editAnalysis ? (
                                  <MathText text={editAnalysis} />
                                ) : (
                                  <span className="text-slate-400 italic">尚未识别并补充本题的深度解析。点击上方「修缮或手动输入 OCR 数据」可一键手动补充！</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 动作发起栏：举一反三 */}
                        <div className="border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-4">
                          <div className="text-xs text-slate-500 leading-relaxed max-w-md">
                            若信息核实准确无误，欢迎点击右下方按钮。我们将调用大模型为您智能匹配生成 3 道对标变式。
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={generateThreeVariants}
                              disabled={isGeneratingVariants}
                              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 text-xs px-5"
                            >
                              {isGeneratingVariants ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>✨</span>} 智能生成举一反三题目
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-8 text-center border border-slate-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-slate-200 mb-3" />
                      <h4 className="font-bold text-slate-800 text-base mb-1">暂无正在作业的错题输入</h4>
                      <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
                        请在左下角使用相机快速拍题、点击本地上传图片或者点击上方精美样例进行一键沙箱模拟载入。
                      </p>
                      
                      {/* 直接便捷录入入口 */}
                      <button
                        onClick={() => {
                          setEditTitle("分式方程特殊无解增根");
                          setEditKnowledgePoint("分式方程求法");
                          setEditText("解方程：$\\frac{2}{x-2} + 3 = \\frac{x}{x-2}$");
                          setEditOptions([]);
                          setEditCorrectAnswer("方程无解。因为代入去分母计算得 $x = 2$，但会导致分母 $x-2 = 0$ 产生增根。");
                          setEditStudentAnswer("算出来答案是 $x = 2$ (漏算增根检验，属于分式计算死穴)");
                          setHasRecognized(true);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-4 py-2.5 rounded-lg text-xs cursor-pointer flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> 纯手工键入创建新记录
                      </button>
                    </div>
                  )}

                  {/* 如果生成了举一反三题目，直接同步展示在下方 */}
                  {variants.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-blue-600" />
                          <h3 className="font-bold text-slate-800 text-sm">智能高保真变式特训题（共3道）</h3>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={generateThreeVariants}
                            disabled={isGeneratingVariants}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> 重新换一组
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6 divide-y divide-slate-100">
                        {variants.map((variant, idx) => (
                          <div key={variant.id || idx} className={`${idx > 0 ? "pt-5" : ""} space-y-3`}>
                            <div className="flex items-start gap-2.5">
                              <span className="flex h-5 w-5 shrink-0 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-black items-center justify-center font-mono">
                                变式 {idx + 1}
                              </span>
                              <div className="font-medium text-slate-900 leading-relaxed font-serif text-sm">
                                <MathText text={variant.questionText} />
                              </div>
                            </div>

                            {/* 选择题展示子项 */}
                            {variant.options && variant.options.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-7">
                                {variant.options.map((opt, oId) => (
                                  <div key={oId} className="text-xs text-slate-600 font-serif">
                                    <MathText text={opt} />
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 详解带有高亮的易错点评 */}
                            <div className="pl-7">
                              <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100 leading-relaxed text-xs text-slate-700 font-serif">
                                <div className="font-black text-amber-900 mb-1 flex items-center gap-1">
                                  <span>参考标准答案：</span>
                                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded border border-emerald-100 font-mono">
                                    <MathText text={variant.correctAnswer} />
                                  </span>
                                </div>
                                <div>
                                  <span className="font-bold text-rose-800 bg-rose-50 px-1 rounded inline-block mb-0.5">※ 致错误区防范解析：</span>
                                  <p className="text-[11px] text-slate-800 mt-0.5">
                                    <MathText text={variant.analysis} />
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 保存至错题本区域 */}
                      <div className="border-t border-slate-200 pt-5 flex items-center justify-between">
                        <p className="text-xs text-slate-500 max-w-md">
                          满意这组变式题吗？满意即点右边，将此原错题及其3道变式卷整体保存到错题本，供后续随时打字练习！
                        </p>
                        
                        <button
                          onClick={saveToMistakeBook}
                          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm cursor-pointer transition-transform active:scale-95"
                        >
                          <BookOpen className="w-4 h-4" /> 保存当前错题库
                        </button>
                      </div>
                    </motion.div>
                  )}

                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="notebook-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* 第二板块：历史错题本页 */}
              
              {/* 控制和统计横幅板 */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shadow-sm">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">错题本资源库</h3>
                    <p className="text-xs text-slate-500">
                      累计本地离线安全缓存了 <span className="font-semibold text-slate-700">{records.length}</span> 道疑难错题记录。
                    </p>
                  </div>
                </div>

                {/* 统计指标 */}
                <div className="flex h-10 divide-x divide-slate-100 text-xs font-serif mr-auto md:mr-0 pl-3 md:pl-0">
                  <div className="pr-4 py-1 flex flex-col">
                    <span className="text-slate-400 text-[10px]">已选中打印</span>
                    <span className="font-black text-blue-600 text-sm font-mono mt-0.5">{selectedIds.length} 题</span>
                  </div>
                  <div className="px-4 py-1 flex flex-col">
                    <span className="text-slate-400 text-[10px]">学科考点覆盖</span>
                    <span className="font-black text-slate-700 text-sm mt-0.5">
                      {Array.from(new Set(records.map(r => r.knowledgePoint))).length} 类
                    </span>
                  </div>
                </div>

                {/* 操作控制端 */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={handleSelectAll}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-600 bg-white"
                  >
                    {selectedIds.length === records.length && records.length > 0 ? "取消全选" : "一键全选"}
                  </button>

                  <button
                    onClick={handleDeleteSelected}
                    disabled={selectedIds.length === 0}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除所选
                  </button>

                  <button
                    onClick={() => setIsPrintMode(true)}
                    disabled={selectedIds.length === 0}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    去打印所选 ({selectedIds.length})
                  </button>
                </div>
              </div>

              {/* 错题卡片主卡片列表 */}
              {records.length === 0 ? (
                <div className="bg-white rounded-xl p-16 text-center border border-slate-200 max-w-xl mx-auto my-12 shadow-sm">
                  <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <h4 className="font-bold text-slate-800 text-base mb-1">现在错题本里空荡荡的</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
                    没有错题记录，可在底部切换回到「错题识别」一键选择我们的名师沙箱经典题目加载或者自己直接拍照识别一份。
                  </p>
                  
                  <button
                    onClick={() => setActiveTab('scan')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs cursor-pointer inline-flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> 马上归档第一道错题
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {records.map((record) => {
                    const isSelected = selectedIds.includes(record.id);
                    const isExpanded = expandedRecordId === record.id;
                    const dateFormatted = new Date(record.createdAt).toLocaleDateString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div 
                        key={record.id}
                        onClick={() => setExpandedRecordId(isExpanded ? null : record.id)}
                        className={`bg-white rounded-xl border transition-all duration-200 relative overflow-hidden cursor-pointer ${
                          isExpanded 
                            ? 'border-blue-400 ring-4 ring-blue-50 shadow-md' 
                            : isSelected 
                              ? 'border-blue-300 shadow-sm' 
                              : 'border-slate-100 hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        {/* 左色块饰带，区分轻挑科目的颜色 */}
                        <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                          record.knowledgePoint.includes("方程") || record.knowledgePoint.includes("判别") 
                            ? 'bg-emerald-500' 
                            : record.knowledgePoint.includes("完成") || record.knowledgePoint.includes("时态")
                              ? 'bg-blue-500' 
                              : 'bg-purple-500'
                        }`} />

                        {/* 卡片收起时的主标题栏 */}
                        <div className="p-4 pl-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            {/* 选择框 */}
                            <button
                              id={`select-btn-${record.id}`}
                              onClick={(e) => handleToggleSelectRecord(record.id, e)}
                              className="mt-1 flex-shrink-0 focus:outline-none"
                            >
                              <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'border-slate-300 bg-white hover:border-blue-400'
                              }`}>
                                {isSelected && <span className="text-[10px] font-bold">✔</span>}
                              </div>
                            </button>

                            <div className="space-y-1">
                              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                {record.title}
                                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                                  {dateFormatted}
                                </span>
                              </h4>
                              
                              <div className="text-xs text-slate-500 line-clamp-1 max-w-2xl font-serif">
                                原母题：<MathText text={record.originalText} />
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                  核心考点：{record.knowledgePoint}
                                </span>
                                {record.variants && record.variants.length > 0 && (
                                  <span className="bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                    绑：{record.variants.length}道变式
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 ml-8 md:ml-0 md:justify-end">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* 卡片点击展开时的核心详情面板 */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden border-t border-slate-100"
                            >
                              <div className="p-5 pl-8 bg-slate-50/50 space-y-6">
                                
                                {/* 原命题和错误原答案 */}
                                <div className="space-y-2.5">
                                  <div className="text-xs font-bold text-slate-500 tracking-wide font-serif">【考情重放・原错母题档案】</div>
                                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-slate-800 leading-relaxed text-sm font-serif">
                                    <MathText text={record.originalText} />
                                    
                                    {record.originalOptions && record.originalOptions.length > 0 && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pl-2">
                                        {record.originalOptions.map((opt, oId) => (
                                          <div key={oId} className="text-slate-700 text-xs font-mono">
                                            <MathText text={opt} />
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    <div className="mt-4 flex flex-wrap gap-4 text-xs border-t border-slate-100 pt-3 font-serif">
                                      {record.originalStudentAnswer && (
                                        <span className="text-rose-700 font-medium">
                                          由于以下思路错答: <span className="font-mono bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded text-[11px]"><MathText text={record.originalStudentAnswer} /></span>
                                        </span>
                                      )}
                                      
                                      {record.originalCorrectAnswer && (
                                        <span className="text-emerald-700 font-medium">
                                          标准正解: <span className="font-mono bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded text-[11px]"><MathText text={record.originalCorrectAnswer} /></span>
                                        </span>
                                      )}
                                    </div>

                                    {record.originalAnalysis && (
                                      <div className="mt-4 border-t border-slate-100 pt-3 space-y-1.5 text-left">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                                          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                          <span>名师原题深度解析 & 避坑指南：</span>
                                        </div>
                                        <div className="text-xs text-slate-800 bg-amber-50/40 p-3 rounded-lg border border-amber-100/60 leading-relaxed font-serif">
                                          <MathText text={record.originalAnalysis} />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* 绑定的举一反三变式训练 */}
                                <div className="space-y-3">
                                  <div className="text-xs font-bold text-blue-900 tracking-wide font-serif">【大模型特制：变式巩固试炼】</div>
                                  
                                  {record.variants && record.variants.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4">
                                      {record.variants.map((v, vIdx) => (
                                        <div key={v.id || vIdx} className="bg-white p-4 rounded-xl border border-slate-200/60 p-4 space-y-2.5 shadow-sm">
                                          <div className="flex items-start gap-2">
                                            <span className="h-5 w-5 rounded bg-blue-50 text-[10px] font-bold text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 mt-0.5 font-mono">
                                              {vIdx + 1}
                                            </span>
                                            <div className="text-xs text-slate-900 leading-relaxed font-semibold font-serif">
                                              <MathText text={v.questionText} />
                                            </div>
                                          </div>

                                          {/* 复本选项 */}
                                          {v.options && v.options.length > 0 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-7">
                                              {v.options.map((opt, oId) => (
                                                <div key={oId} className="text-xs text-slate-600 font-serif font-mono">
                                                  <MathText text={opt} />
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-100/70 text-xs font-serif leading-relaxed">
                                            <div className="font-bold text-amber-950 flex items-center gap-1 mb-1">
                                              <span>正确答案：</span>
                                              <span className="text-emerald-800 bg-emerald-50 border border-emerald-100 font-bold px-1 rounded">
                                                <MathText text={v.correctAnswer} />
                                              </span>
                                            </div>
                                            <div>
                                              <span className="font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded inline-block text-[10px] mb-1">※ 易错点分析归纳：</span>
                                              <p className="text-slate-800 text-[11px]">
                                                <MathText text={v.analysis} />
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="bg-white rounded-xl p-5 text-center border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 shadow-xs">
                                      <p className="text-xs text-slate-400">该错题在保存时尚未绑定举一反三题目...</p>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation(); // 阻止展开气泡折叠
                                          // 带着该条卡片一键重上识别页去重新伴学
                                          setEditTitle(record.title);
                                          setEditKnowledgePoint(record.knowledgePoint);
                                          setEditText(record.originalText);
                                          setEditOptions(record.originalOptions || []);
                                          setEditCorrectAnswer(record.originalCorrectAnswer || "");
                                          setEditStudentAnswer(record.originalStudentAnswer || "");
                                          setImageB64("simulated_math");
                                          setHasRecognized(true);
                                          setActiveTab('scan');
                                        }}
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                                      >
                                        一键调回错题扫描页重新生成变式
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* 单个删除或重新取向 */}
                                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`确定要彻底删除错题《${record.title}》吗？`)) {
                                        const remaining = records.filter(x => x.id !== record.id);
                                        saveRecordsToLocalStorage(remaining);
                                        setSelectedIds(selectedIds.filter(x => x !== record.id));
                                        alert("已成功从错题单中删除。");
                                      }
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 font-semibold hover:bg-rose-50/70 rounded-md cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> 移出本错题
                                  </button>
                                </div>

                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 底部导航栏切换区 */}
      <nav id="bottom-bar" className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 px-6 z-40 shadow-xl flex items-center justify-center gap-8">
        <button
          onClick={() => setActiveTab('scan')}
          className={`flex flex-col items-center gap-1 text-xs font-bold transition-all px-6 py-1 rounded-lg cursor-pointer ${
            activeTab === 'scan' ? 'text-blue-600 scale-105 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Camera className="w-5 h-5" />
          <span>错题识别页</span>
        </button>

        <button
          onClick={() => setActiveTab('notebook')}
          className={`flex flex-col items-center gap-1 text-xs font-bold transition-all px-6 py-1 rounded-lg cursor-pointer ${
            activeTab === 'notebook' ? 'text-blue-600 scale-105 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>历史错题本</span>
        </button>
      </nav>

      {/* 打印排版预览模态层 */}
      {isPrintMode && (
        <PrintPreview 
          selectedRecords={records.filter(r => selectedIds.includes(r.id))}
          onClose={() => setIsPrintMode(false)}
        />
      )}
    </div>
  );
}
