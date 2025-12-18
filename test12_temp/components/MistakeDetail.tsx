import React, { useState, useEffect } from 'react';
import { MistakeItem, MistakeType, SourceType } from '../types';
import { 
  ArrowLeft, Star, Play, Pause, RotateCcw, CheckCircle2, 
  ChevronDown, ChevronUp, Copy, Mic, History, Sparkles, 
  BookOpen, Zap, Target, BarChart3, Calendar, Tag,
  ArrowRight, BrainCircuit, Quote, Timer, RotateCw, ChevronRight, X
} from 'lucide-react';

interface MistakeDetailProps {
  item: MistakeItem;
  onBack: () => void;
  onToggleMaster: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const MistakeDetail: React.FC<MistakeDetailProps> = ({ item, onBack, onToggleMaster, onToggleFavorite }) => {
  const isQuestionBank = item.source === SourceType.QUESTION_BANK || item.source === SourceType.MOCK_EXAM;

  // --- INTERVIEW MODE STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRefAnswer, setShowRefAnswer] = useState(true);

  // --- QUESTION BANK MODE STATE ---
  const [qbAnswer, setQbAnswer] = useState('');
  const [qbTimer, setQbTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [expandedSection, setExpandedSection] = useState<'reference' | 'analysis' | null>(null);
  const [qbSubmitted, setQbSubmitted] = useState(false);

  // Mock Analysis Data (Shared)
  const analysisData = {
    score: item.mastery || 65,
    fluency: 85,
    logic: 60,
    concept: 75,
    diagnosis: [
      {
        type: 'concept',
        color: 'rose',
        icon: BrainCircuit,
        title: '核心概念偏差',
        desc: '对事件循环(Event Loop)的宏任务与微任务执行顺序理解有误，混淆了 setTimeout 和 Promise 的优先级。',
        suggestion: '建议重新阅读《JavaScript 高级程序设计》第 17 章，或并在控制台运行 Demo 验证。'
      },
      {
        type: 'logic',
        color: 'amber',
        icon: Zap,
        title: '因果链条缺失',
        desc: '在解释现象时，直接跳到了结果，中间缺乏“调用栈清空”这一关键步骤的描述。',
        suggestion: '尝试使用“因为...所以...”的句式强迫自己补全逻辑链路。'
      }
    ],
    history: [
      { date: '10/28', score: 60 },
      { date: '10/25', score: 45 },
      { date: '10/20', score: 20 },
    ]
  };

  // Timer Logic for Question Bank
  useEffect(() => {
      let interval: any;
      if (isQuestionBank && isTimerRunning && !qbSubmitted) {
          interval = setInterval(() => {
              setQbTimer(prev => prev + 1);
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [isQuestionBank, isTimerRunning, qbSubmitted]);

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins > 0 ? `${mins}分` : ''}${secs}秒`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return 'stroke-emerald-500';
    if (score >= 60) return 'stroke-amber-500';
    return 'stroke-rose-500';
  };

  // --- RENDER: QUESTION BANK MODE ---
  if (isQuestionBank) {
      return (
        <div className="bg-white min-h-screen flex flex-col font-sans animate-fadeIn relative">
            {/* Top Close Bar */}
             <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400 hover:text-gray-900 cursor-pointer transition-colors" onClick={onBack}>
                    <ArrowLeft size={20} />
                    <span className="text-sm font-medium">返回</span>
                </div>
                <div className="flex items-center gap-4">
                     {/* Timer Badge */}
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold font-mono">
                        <Timer size={14} />
                        {formatTime(qbTimer)}
                     </div>
                     <button 
                        onClick={() => onToggleFavorite(item.id)}
                        className={`text-gray-400 hover:text-amber-400 transition-colors ${item.isFavorite ? 'text-amber-400' : ''}`}
                     >
                        <Star size={20} fill={item.isFavorite ? "currentColor" : "none"} />
                     </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full px-6 py-8 space-y-8 pb-32">
                
                {/* 1. Header & Question */}
                <div className="space-y-6">
                    <div className="flex justify-between items-start gap-4">
                        <h1 className="text-2xl font-bold text-gray-900 leading-snug">
                            {item.question}
                        </h1>
                    </div>
                    
                    {/* Tags Row */}
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-medium border border-emerald-100">
                            基础
                        </span>
                        <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                            简答题
                        </span>
                        {item.tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 rounded bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed">
                        <p>
                            {item.snippet}
                            <br/>
                            (此处为模拟的完整题目描述：请结合实际应用场景，详细阐述该技术点的原理、优缺点及选型依据。)
                        </p>
                    </div>
                </div>

                {/* 2. Answer Input Area */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-bold text-gray-900">提交你的答案</h3>
                    </div>
                    <div className="relative group">
                        <textarea 
                            value={qbAnswer}
                            onChange={(e) => setQbAnswer(e.target.value)}
                            className="w-full min-h-[240px] p-4 rounded-xl border border-gray-300 text-gray-700 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y placeholder-gray-400 shadow-sm"
                            placeholder="写下你的解题思路或关键要点..."
                        />
                        {/* Markdown / Formatting hints could go here */}
                    </div>
                    
                    <div className="mt-4 flex items-center gap-6">
                        <button 
                            onClick={() => { setQbSubmitted(true); setIsTimerRunning(false); }}
                            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/30 transition-all active:scale-95"
                        >
                            提交作答
                        </button>
                        <button 
                            onClick={() => { setQbAnswer(''); setQbTimer(0); setIsTimerRunning(true); setQbSubmitted(false); }}
                            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <RotateCw size={14} />
                            重置
                        </button>
                        <span className="text-sm text-gray-400">
                            已用时 {formatTime(qbTimer)}
                        </span>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 my-8"></div>

                {/* 3. Expandable Sections (Reference & Analysis) */}
                <div className="space-y-4">
                    {/* Reference Answer */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <button 
                            onClick={() => setExpandedSection(expandedSection === 'reference' ? null : 'reference')}
                            className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
                        >
                            <span className="text-base font-bold text-gray-900">参考答案</span>
                            {expandedSection === 'reference' ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronRight size={20} className="text-gray-400"/>}
                        </button>
                        {expandedSection === 'reference' && (
                            <div className="px-6 py-5 bg-gray-50/50 border-t border-gray-200 animate-fadeIn">
                                <div className="prose prose-sm max-w-none text-gray-700">
                                    <p>这是标准参考答案的内容...</p>
                                    <ul>
                                        <li>关键点一：原理阐述准确</li>
                                        <li>关键点二：包含实际案例</li>
                                        <li>关键点三：逻辑清晰</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Analysis */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <button 
                            onClick={() => setExpandedSection(expandedSection === 'analysis' ? null : 'analysis')}
                            className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
                        >
                            <span className="text-base font-bold text-gray-900">解析说明</span>
                            {expandedSection === 'analysis' ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronRight size={20} className="text-gray-400"/>}
                        </button>
                        {expandedSection === 'analysis' && (
                            <div className="px-6 py-5 bg-gray-50/50 border-t border-gray-200 animate-fadeIn">
                                <div className="prose prose-sm max-w-none text-gray-700">
                                    <p>此处是对题目的详细解析，包括考点分析、常见误区以及扩展知识。</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. History / Recent Records */}
                <div className="pt-8">
                     <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                        <h3 className="text-base font-bold text-gray-900">最近练习记录</h3>
                     </div>
                     
                     <div className="relative pl-4 space-y-8 before:absolute before:left-[21px] before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                         {[1, 2, 3].map((_, i) => (
                             <div key={i} className="relative flex items-center justify-between group">
                                 <div className="absolute left-[3px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] bg-white border-2 border-gray-300 rounded-full group-hover:border-indigo-500 group-hover:scale-110 transition-all z-10"></div>
                                 <div className="ml-8 flex-1 flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">{i === 0 ? '2分钟前' : `${i + 1}天前`}</span>
                                        <span className="text-xs text-gray-500">用时 12分30秒</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${i === 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {i === 0 ? '错误' : '正确'}
                                        </span>
                                        <ChevronRight size={16} className="text-gray-300" />
                                    </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>

            </div>
        </div>
      );
  }

  // --- RENDER: INTERVIEW MODE (Existing) ---
  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col font-sans animate-fadeIn">
      
      {/* --- Top Navigation Bar --- */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">返回列表</span>
          </button>
          
          <div className="flex items-center gap-3">
             <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">
                上次复习: {item.lastReviewed}
             </span>
             <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
             <button 
                onClick={() => onToggleFavorite(item.id)}
                className={`p-2 rounded-full border transition-all ${item.isFavorite ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'}`}
                title="收藏"
             >
                <Star size={18} fill={item.isFavorite ? "currentColor" : "none"} strokeWidth={2} />
             </button>
             <button 
                onClick={() => onToggleMaster(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                  item.mastery === 100 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }`}
             >
                <CheckCircle2 size={16} className={item.mastery === 100 ? 'text-emerald-500' : 'text-gray-400'} strokeWidth={2.5} />
                <span>{item.mastery === 100 ? '已掌握' : '标记掌握'}</span>
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT COLUMN: Main Content (8 cols) --- */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Header Section */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                 <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                    item.type === MistakeType.KNOWLEDGE_GAP ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                    item.type === MistakeType.LOGIC_CONFUSION ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                 }`}>
                   {item.type}
                 </span>
                 {item.tags.map(tag => (
                   <span key={tag} className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                      <Tag size={10} />
                      {tag}
                   </span>
                 ))}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                {item.question}
              </h1>
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <Mic size={14} />
                面试来源：前端开发工程师面试 (AI) · 2023/10/28
              </p>
            </div>

            {/* 2. Audio & Transcript Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
               <div className="p-1 bg-gray-50 border-b border-gray-100 flex items-center justify-between px-4 py-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                     <History size={14} />
                     场景回溯
                  </h3>
               </div>
               
               <div className="p-6">
                  {/* Modern Audio Player */}
                  <div className="bg-slate-900 rounded-xl p-4 mb-6 text-white flex items-center gap-5 shadow-lg shadow-indigo-500/10 relative overflow-hidden">
                     {/* Background decoration */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                     
                     <button 
                       onClick={() => setIsPlaying(!isPlaying)}
                       className="w-12 h-12 bg-white hover:bg-gray-100 text-slate-900 rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-lg active:scale-95 z-10"
                     >
                       {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1"/>}
                     </button>
                     
                     <div className="flex-1 z-10">
                        <div className="flex items-end gap-1 h-8 mb-2 opacity-80">
                           {/* Fake Waveform visualization */}
                           {[40, 60, 45, 70, 90, 60, 30, 50, 70, 85, 60, 40, 30, 50, 65, 80, 50, 30, 45, 60, 75, 50, 40, 60, 80, 40].map((h, i) => (
                              <div key={i} className={`w-1 bg-indigo-400 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`} style={{ height: `${h}%`, opacity: i > 15 ? 0.3 : 1 }}></div>
                           ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                           <span>00:15</span>
                           <span>01:42</span>
                        </div>
                     </div>
                  </div>

                  {/* Transcript */}
                  <div className="relative pl-4 border-l-2 border-indigo-100">
                     <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                     </div>
                     <div className="mb-2 text-xs font-bold text-gray-500">我的回答</div>
                     <p className="text-gray-700 text-sm leading-relaxed">
                        {item.snippet} ...除此之外，我认为 Promise 的链式调用还能解决回调地狱的问题。
                        关于具体的执行顺序，应该是先执行所有的同步代码，然后再去执行异步代码。
                        <span className="bg-rose-100 text-rose-800 px-1 mx-0.5 rounded border-b border-rose-200 font-medium cursor-help relative group/tooltip">
                           异步代码里好像是先执行 setTimeout
                           <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-20">
                              此处概念模糊：宏任务(setTimeout)优先级实际上低于微任务(Promise)。
                           </span>
                        </span>，
                        然后再执行 Promise 的 then 回调？这一点我有点记不太清了。
                     </p>
                  </div>
               </div>
            </div>

            {/* 3. AI Diagnosis Section (Cards) */}
            <div>
               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles size={20} className="text-indigo-600" />
                  AI 智能诊断
               </h3>
               <div className="grid md:grid-cols-2 gap-4">
                  {analysisData.diagnosis.map((diag, idx) => (
                     <div key={idx} className={`bg-white p-5 rounded-2xl border ${diag.type === 'concept' ? 'border-rose-100 shadow-rose-500/5' : 'border-amber-100 shadow-amber-500/5'} shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow`}>
                        <div className={`absolute top-0 left-0 w-1 h-full ${diag.type === 'concept' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                        <div className="flex items-start justify-between mb-3">
                           <div className={`p-2 rounded-lg ${diag.type === 'concept' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                              <diag.icon size={18} />
                           </div>
                           <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${diag.type === 'concept' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                              {diag.type === 'concept' ? 'Knowledge' : 'Logic'}
                           </span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">{diag.title}</h4>
                        <p className="text-xs text-gray-600 leading-relaxed mb-4">
                           {diag.desc}
                        </p>
                        <div className={`text-xs p-3 rounded-lg ${diag.type === 'concept' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'}`}>
                           <span className="font-bold mr-1">💡 建议:</span> {diag.suggestion}
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* 4. Comparison & Knowledge */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
               <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                     <BookOpen size={18} className="text-emerald-600" />
                     深度解析 & 参考
                  </h3>
                  <button 
                     onClick={() => setShowRefAnswer(!showRefAnswer)}
                     className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 hover:bg-gray-50 transition-colors"
                  >
                     {showRefAnswer ? '收起解析' : '展开解析'}
                     {showRefAnswer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
               </div>
               
               {showRefAnswer && (
                 <div className="p-6">
                    <div className="mb-6">
                       <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <Quote size={14} className="text-emerald-500" />
                          标准回答逻辑
                       </h4>
                       <div className="prose prose-sm prose-emerald max-w-none text-gray-600 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                          <p>
                             在 JavaScript 事件循环中，<strong>同步代码</strong>首先执行。接着执行<strong>微任务 (Microtasks)</strong>（如 <code>Promise.then</code>, <code>MutationObserver</code>），最后执行<strong>宏任务 (Macrotasks)</strong>（如 <code>setTimeout</code>, <code>setInterval</code>, I/O）。
                          </p>
                          <p className="mt-2">
                             关键点在于：<strong>每次宏任务执行完毕后，浏览器都会优先清空微任务队列</strong>，然后再去取下一个宏任务。因此，Promise 的回调永远比同轮次或后续的 setTimeout 先执行。
                          </p>
                       </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                       <button className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group text-left">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                                <Copy size={16} />
                             </div>
                             <div>
                                <div className="text-xs font-bold text-gray-900">代码示例</div>
                                <div className="text-[10px] text-gray-500">Event Loop 执行顺序 Demo</div>
                             </div>
                          </div>
                          <ArrowRight size={14} className="text-gray-300 group-hover:text-indigo-400" />
                       </button>
                       <button className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group text-left">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                                <Target size={16} />
                             </div>
                             <div>
                                <div className="text-xs font-bold text-gray-900">专项练习</div>
                                <div className="text-[10px] text-gray-500">5 道宏微任务排序题</div>
                             </div>
                          </div>
                          <ArrowRight size={14} className="text-gray-300 group-hover:text-indigo-400" />
                       </button>
                    </div>
                 </div>
               )}
            </div>

          </div>

          {/* --- RIGHT COLUMN: Stats & Metadata (4 cols) --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Score Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400"></div>
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">综合掌握度</h3>
               
               {/* Radial Progress */}
               <div className="relative w-40 h-40 mx-auto mb-6">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                     <circle className="text-gray-100 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                     <circle 
                        className={`${getScoreRingColor(analysisData.score)} transition-all duration-1000 ease-out`} 
                        strokeWidth="8" 
                        strokeLinecap="round" 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="transparent" 
                        strokeDasharray="251.2" 
                        strokeDashoffset={251.2 - (251.2 * analysisData.score) / 100}
                     ></circle>
                  </svg>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                     <span className={`text-4xl font-black ${getScoreColor(analysisData.score)}`}>{analysisData.score}</span>
                     <span className="block text-xs text-gray-400 font-medium">/ 100</span>
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-500 flex items-center gap-1.5"><Zap size={14}/> 流畅度</span>
                     <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500 rounded-full" style={{width: '85%'}}></div>
                        </div>
                        <span className="font-bold text-gray-700">85</span>
                     </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-500 flex items-center gap-1.5"><BrainCircuit size={14}/> 逻辑性</span>
                     <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                           <div className="h-full bg-amber-500 rounded-full" style={{width: '60%'}}></div>
                        </div>
                        <span className="font-bold text-gray-700">60</span>
                     </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-500 flex items-center gap-1.5"><Target size={14}/> 准确度</span>
                     <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 rounded-full" style={{width: '75%'}}></div>
                        </div>
                        <span className="font-bold text-gray-700">75</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* 2. Review History */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar size={14} />
                  复习轨迹
               </h3>
               <div className="relative pl-2 space-y-4">
                  <div className="absolute left-[5px] top-1 bottom-1 w-px bg-gray-100"></div>
                  {analysisData.history.map((h, idx) => (
                     <div key={idx} className="relative flex items-center justify-between pl-5 group">
                        <div className={`absolute left-0 w-[11px] h-[11px] rounded-full border-2 border-white shadow-sm z-10 ${idx === 0 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                        <span className={`text-xs font-medium ${idx === 0 ? 'text-gray-900' : 'text-gray-400'}`}>{h.date}</span>
                        <div className="flex items-center gap-2">
                           <div className={`h-1.5 rounded-full ${h.score >= 60 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{width: `${h.score/2}px`}}></div>
                           <span className={`text-xs font-bold ${h.score >= 60 ? 'text-emerald-600' : 'text-rose-500'}`}>{h.score}分</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* 3. Action Button */}
            <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 group">
               <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
               再答一次
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MistakeDetail;