import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SourceType, MistakeType, MistakeItem, FilterState, ReviewBatch } from './types';
import Sidebar from './components/Sidebar';
import MistakeCard from './components/MistakeCard';
import MistakeDetail from './components/MistakeDetail';
import { Search, Play, LayoutGrid, List as ListIcon, BookOpen, ChevronDown, FilterX, BrainCircuit, ArrowDownWideNarrow, ArrowUpNarrowWide, Trash2, CheckCircle2, CopyPlus, Check, X, FolderPlus, Plus, Folder, AlertTriangle, Pencil, Calendar, ChevronRight, EyeOff, Eye } from 'lucide-react';

// --- MOCK DATA ---
const INITIAL_DATA: MistakeItem[] = [
  {
    id: '1',
    question: 'HTTP 缓存控制策略有哪些？',
    snippet: '对比强缓存与协商缓存，说明适用场景与常见 Header。Expires 和 Cache-Control 的区别，以及 Last-Modified/If-Modified-Since 的运作机制...',
    type: MistakeType.INCOMPLETE,
    source: SourceType.FULLSTACK_INTERVIEW,
    tags: ['HTTP', 'Network', 'Web Performance'],
    mistakeCount: 5,
    mastery: 15,
    lastReviewed: '3小时前',
    isFavorite: true,
    isIgnored: false
  },
  {
    id: '2',
    question: '什么是闭包？在实际项目中如何应用？',
    snippet: '请解释 JavaScript 闭包的概念，并给出两个常见使用场景。例如模块化封装私有变量，以及防抖节流函数中的应用...',
    type: MistakeType.KNOWLEDGE_GAP,
    source: SourceType.FRONTEND_INTERVIEW,
    tags: ['JavaScript', 'Core Concept'],
    mistakeCount: 3,
    mastery: 45,
    lastReviewed: '20小时前',
    isFavorite: false,
    isIgnored: false
  },
  {
    id: '3',
    question: 'React Fiber 的工作原理是什么？',
    snippet: '解释 React 16+ 的协调引擎如何通过链表结构实现任务分割与优先级调度。requestIdleCallback 的作用以及它在浏览器渲染帧中的位置...',
    type: MistakeType.LOGIC_CONFUSION,
    source: SourceType.FRONTEND_INTERVIEW,
    tags: ['React', 'Fiber', 'Source Code'],
    mistakeCount: 8,
    mastery: 10,
    lastReviewed: '1天前',
    isFavorite: true,
    isIgnored: false
  },
  {
    id: '4',
    question: 'TCP 三次握手与四次挥手全过程',
    snippet: '详细描述 SYN, ACK, FIN 标志位的变化以及序列号的传递。为什么需要三次握手而不是两次？TIME_WAIT 状态存在的意义是什么...',
    type: MistakeType.KNOWLEDGE_GAP,
    source: SourceType.BACKEND_INTERVIEW,
    tags: ['Network', 'TCP/IP'],
    mistakeCount: 2,
    mastery: 80,
    lastReviewed: '2天前',
    isFavorite: false,
    isIgnored: false
  },
  {
    id: '5',
    question: 'Vue 3 响应式原理与 Vue 2 的区别',
    snippet: 'Proxy 与 Object.defineProperty 的性能差异，以及对数组和新增属性的支持情况。Reflect 在其中的作用...',
    type: MistakeType.EXPRESSION,
    source: SourceType.FRONTEND_INTERVIEW,
    tags: ['Vue', 'Proxy', 'Reactive'],
    mistakeCount: 4,
    mastery: 55,
    lastReviewed: '5小时前',
    isFavorite: false,
    isIgnored: false
  },
  {
    id: '6',
    question: 'Webpack Loader 和 Plugin 的区别',
    snippet: 'Loader 负责转换源文件，Plugin 负责监听构建生命周期并注入功能。请手写一个简单的 Loader...',
    type: MistakeType.INCOMPLETE,
    source: SourceType.FULLSTACK_INTERVIEW,
    tags: ['Webpack', 'Build Tools'],
    mistakeCount: 1,
    mastery: 90,
    lastReviewed: '30分钟前',
    isFavorite: false,
    isIgnored: false
  },
  {
    id: '7',
    question: '二叉树的层序遍历',
    snippet: '实现二叉树的层序遍历，要求输出二维数组。使用队列实现广度优先搜索 (BFS)...',
    type: MistakeType.LOGIC_CONFUSION,
    source: SourceType.QUESTION_BANK,
    tags: ['Algorithm', 'Tree', 'BFS'],
    mistakeCount: 6,
    mastery: 30,
    lastReviewed: '4小时前',
    isFavorite: false,
    isIgnored: false
  },
  {
    id: '8',
    question: '手写 Promise.allSettled',
    snippet: 'Promise.allSettled 与 Promise.all 的区别。请手动实现一个 polyfill...',
    type: MistakeType.INCOMPLETE,
    source: SourceType.QUESTION_BANK,
    tags: ['JavaScript', 'Promise', 'Polyfill'],
    mistakeCount: 2,
    mastery: 60,
    lastReviewed: '1小时前',
    isFavorite: true,
    isIgnored: false
  },
  {
    id: '9',
    question: 'CSS 盒模型与 BFC',
    snippet: '标准盒模型与 IE 盒模型的区别。BFC 的触发条件及其在布局中的应用（清除浮动、防止 margin 重叠）...',
    type: MistakeType.KNOWLEDGE_GAP,
    source: SourceType.MOCK_EXAM,
    tags: ['CSS', 'Layout'],
    mistakeCount: 1,
    mastery: 85,
    lastReviewed: '5天前',
    isFavorite: false,
    isIgnored: false
  }
];

// Mock Data for Batches
const INITIAL_BATCHES: ReviewBatch[] = [
    { id: 'b1', name: '网络协议专项', mistakeIds: ['1', '4'], createdAt: new Date().toISOString() },
    { id: 'b2', name: '前端核心考点', mistakeIds: ['2', '3', '5'], createdAt: new Date().toISOString() }
];

type SortOption = 'recent' | 'mastery_asc' | 'count_desc';

interface ConfirmConfig {
    isOpen: boolean;
    type: 'master' | 'delete' | 'ignore' | null;
    count: number;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'interview' | 'bank' | 'batches'>('bank');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Convert Mock Data to State to allow mutations (like toggling favorites)
  const [allData, setAllData] = useState<MistakeItem[]>(INITIAL_DATA);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    selectedSources: [],
    selectedTypes: [],
    selectedTags: [],
    showFavorites: false,
    showIgnored: false
  });
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Navigation State
  const [viewingMistakeId, setViewingMistakeId] = useState<string | null>(null);

  // Batch Management State
  const [reviewBatches, setReviewBatches] = useState<ReviewBatch[]>(INITIAL_BATCHES);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Batch Editing State
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({
      isOpen: false,
      type: null,
      count: 0
  });

  // Sorting State
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Close sort menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine available source types based on active tab
  const availableSources = useMemo(() => {
      if (activeTab === 'interview') {
          return [SourceType.FRONTEND_INTERVIEW, SourceType.BACKEND_INTERVIEW, SourceType.FULLSTACK_INTERVIEW];
      } else if (activeTab === 'bank') {
          return [SourceType.QUESTION_BANK, SourceType.MOCK_EXAM];
      }
      return [];
  }, [activeTab]);

  const ALL_TAGS = useMemo(() => {
      // Filter tags based on items available in current view
      const relevantItems = allData.filter(item => availableSources.includes(item.source));
      return Array.from(new Set(relevantItems.flatMap(item => item.tags)));
  }, [allData, availableSources]);

  const filteredData = useMemo(() => {
    return allData.filter(item => {
      // 1. Context Filter (Page Level)
      if (!availableSources.includes(item.source)) return false;

      // 2. Sidebar Filters
      const matchSearch = item.question.toLowerCase().includes(filters.search.toLowerCase()) || 
                          item.tags.some(t => t.toLowerCase().includes(filters.search.toLowerCase()));
      const matchSource = filters.selectedSources.length === 0 || filters.selectedSources.includes(item.source);
      const matchType = filters.selectedTypes.length === 0 || filters.selectedTypes.includes(item.type);
      const matchTags = filters.selectedTags.length === 0 || filters.selectedTags.every(t => item.tags.includes(t));
      const matchFavorite = filters.showFavorites ? item.isFavorite : true;
      
      // If showing ignored, we want items where isIgnored is TRUE
      // If NOT showing ignored (default), we want items where isIgnored is FALSE
      const matchIgnored = filters.showIgnored ? item.isIgnored : !item.isIgnored;
      
      return matchSearch && matchSource && matchType && matchTags && matchFavorite && matchIgnored;
    });
  }, [filters, allData, availableSources]);

  // Sorting Logic
  const sortedData = useMemo(() => {
    const data = [...filteredData];
    
    // Helper to approximate minutes from relative string
    const getMinutesAgo = (str: string) => {
        const num = parseInt(str.match(/\d+/)?.[0] || '0');
        if(str.includes('分钟')) return num;
        if(str.includes('小时')) return num * 60;
        if(str.includes('天')) return num * 1440;
        return 999999;
    };

    switch(sortBy) {
        case 'recent':
            return data.sort((a, b) => getMinutesAgo(a.lastReviewed) - getMinutesAgo(b.lastReviewed));
        case 'mastery_asc':
            return data.sort((a, b) => a.mastery - b.mastery);
        case 'count_desc':
            return data.sort((a, b) => b.mistakeCount - a.mistakeCount);
        default:
            return data;
    }
  }, [filteredData, sortBy]);

  // Calculate counts for sidebar
  const counts = useMemo(() => {
    // Base helper: Check Search and Favorites (Global filters) and Page Context
    const matchesBase = (item: MistakeItem) => {
        const matchContext = availableSources.includes(item.source);
        const matchSearch = !filters.search || item.question.toLowerCase().includes(filters.search.toLowerCase()) || item.tags.some(t => t.toLowerCase().includes(filters.search.toLowerCase()));
        const matchFav = !filters.showFavorites || item.isFavorite;
        // Respect current view mode for counts
        const matchIgnored = filters.showIgnored ? item.isIgnored : !item.isIgnored;
        return matchContext && matchSearch && matchFav && matchIgnored;
    };

    // 1. Source Counts
    const sourceCounts: Record<string, number> = {};
    allData.forEach(item => {
        if (!matchesBase(item)) return;
        const matchType = filters.selectedTypes.length === 0 || filters.selectedTypes.includes(item.type);
        const matchTags = filters.selectedTags.length === 0 || filters.selectedTags.every(t => item.tags.includes(t));
        if (matchType && matchTags) {
             sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
        }
    });

    // 2. Type Counts
    const typeCounts: Record<string, number> = {};
    allData.forEach(item => {
        if (!matchesBase(item)) return;
        const matchSource = filters.selectedSources.length === 0 || filters.selectedSources.includes(item.source);
        const matchTags = filters.selectedTags.length === 0 || filters.selectedTags.every(t => item.tags.includes(t));
        if (matchSource && matchTags) {
            typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
        }
    });

    // 3. Tag Counts
    const tagCounts: Record<string, number> = {};
    filteredData.forEach(item => {
        item.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    return { sources: sourceCounts, types: typeCounts, tags: tagCounts };
  }, [allData, filteredData, filters, availableSources]);


  const clearFilters = () => {
    setFilters({
        search: '',
        selectedSources: [],
        selectedTypes: [],
        selectedTags: [],
        showFavorites: false,
        showIgnored: false
    });
  };

  const toggleFavorite = (id: string) => {
    setAllData(prev => prev.map(item => 
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const toggleIgnore = (id: string) => {
      setAllData(prev => prev.map(item => 
          item.id === id ? { ...item, isIgnored: !item.isIgnored } : item
      ));
      // Remove from selection if visible state changes causing it to disappear
      if (selectedIds.has(id)) {
          setSelectedIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(id);
              return newSet;
          });
      }
  };

  const toggleMaster = (id: string) => {
    setAllData(prev => prev.map(item => 
        item.id === id ? { ...item, mastery: 100 } : item
    ));
  };

  const handleUpdateMistake = (updatedItem: MistakeItem) => {
    setAllData(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const getSortLabel = (sort: SortOption) => {
      switch(sort) {
          case 'recent': return '最近更新';
          case 'mastery_asc': return '掌握度 (低到高)';
          case 'count_desc': return '错误次数 (多到少)';
          default: return '排序';
      }
  };

  // --- SELECTION LOGIC ---
  const toggleSelection = (id: string) => {
      setSelectedIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
              newSet.delete(id);
          } else {
              newSet.add(id);
          }
          return newSet;
      });
  };

  const selectAll = () => {
      if (selectedIds.size === sortedData.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(sortedData.map(item => item.id)));
      }
  };

  const clearSelection = () => {
      setSelectedIds(new Set());
  };

  // --- BULK ACTIONS ---
  const handleBulkMaster = () => {
      setConfirmConfig({
          isOpen: true,
          type: 'master',
          count: selectedIds.size
      });
  };

  const handleBulkDelete = () => {
      setConfirmConfig({
          isOpen: true,
          type: 'delete',
          count: selectedIds.size
      });
  };

  const handleBulkIgnore = () => {
      setConfirmConfig({
          isOpen: true,
          type: 'ignore',
          count: selectedIds.size
      });
  };

  const executeBulkAction = () => {
      if (confirmConfig.type === 'master') {
          setAllData(prev => prev.map(item => 
              selectedIds.has(item.id) ? { ...item, mastery: 100 } : item
          ));
      } else if (confirmConfig.type === 'delete') {
          setAllData(prev => prev.filter(item => !selectedIds.has(item.id)));
      } else if (confirmConfig.type === 'ignore') {
          setAllData(prev => prev.map(item => 
              selectedIds.has(item.id) ? { ...item, isIgnored: true } : item
          ));
      }
      
      setConfirmConfig({ isOpen: false, type: null, count: 0 });
      clearSelection();
  };

  const handleOpenBatchModal = () => {
      setNewBatchName('');
      setSelectedBatchId(null);
      setEditingBatchId(null);
      setIsBatchModalOpen(true);
  };

  // Validation helper
  const isNameValid = (name: string) => name.trim().length > 0 && name.length <= 50;

  const handleSaveToBatch = () => {
      if (!isNameValid(newBatchName) && !selectedBatchId) return;

      if (newBatchName.trim()) {
          // Create new batch
          const newBatch: ReviewBatch = {
              id: Date.now().toString(), // Simple ID gen
              name: newBatchName.trim(),
              mistakeIds: Array.from(selectedIds),
              createdAt: new Date().toISOString()
          };
          setReviewBatches(prev => [newBatch, ...prev]);
      } else if (selectedBatchId) {
          // Add to existing batch
          setReviewBatches(prev => prev.map(batch => {
              if (batch.id === selectedBatchId) {
                  // Add only unique IDs
                  const updatedIds = Array.from(new Set([...batch.mistakeIds, ...Array.from(selectedIds)]));
                  return { ...batch, mistakeIds: updatedIds };
              }
              return batch;
          }));
      }

      setIsBatchModalOpen(false);
      clearSelection();
  };

  // --- BATCH MANAGEMENT HANDLERS ---
  const handleDeleteBatch = (e: React.MouseEvent, batchId: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个复习集吗？')) {
        setReviewBatches(prev => prev.filter(b => b.id !== batchId));
        if (selectedBatchId === batchId) setSelectedBatchId(null);
    }
  };

  const handleStartEdit = (e: React.MouseEvent, batch: ReviewBatch) => {
      e.stopPropagation();
      setEditingBatchId(batch.id);
      setEditingName(batch.name);
  };

  const handleSaveBatchName = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editingBatchId && isNameValid(editingName)) {
          setReviewBatches(prev => prev.map(b => 
              b.id === editingBatchId ? { ...b, name: editingName.trim() } : b
          ));
          setEditingBatchId(null);
          setEditingName('');
      }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingBatchId(null);
      setEditingName('');
  };

  const handleStartReview = () => {
    setActiveTab('batches');
  };

  // --- RENDER DETAIL VIEW IF ACTIVE ---
  if (viewingMistakeId) {
     const mistake = allData.find(m => m.id === viewingMistakeId);
     if (mistake) {
         return (
             <MistakeDetail 
                item={mistake} 
                onBack={() => setViewingMistakeId(null)}
                onToggleMaster={toggleMaster}
                onToggleFavorite={toggleFavorite}
             />
         );
     }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 relative">
      
      {/* --- HEADER --- */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 h-16">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
               <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                  <BookOpen size={20} strokeWidth={2.5} />
               </div>
               <div className="flex flex-col">
                   <h1 className="text-base font-bold text-gray-900 leading-none">错题本</h1>
                   <span className="text-[10px] text-gray-500 font-medium tracking-wide mt-0.5">错题诊断与复习平台</span>
               </div>
            </div>

            <nav className="hidden md:flex gap-1 bg-gray-100/50 p-1 rounded-lg border border-gray-200/50">
               <button 
                onClick={() => { setActiveTab('bank'); clearSelection(); }}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${activeTab === 'bank' ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
               >
                 题库错题
               </button>
               <button 
                 onClick={() => { setActiveTab('interview'); clearSelection(); }}
                 className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${activeTab === 'interview' ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
               >
                 面试复盘
               </button>
               <button 
                 onClick={() => { setActiveTab('batches'); clearSelection(); }}
                 className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${activeTab === 'batches' ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
               >
                 复习集
               </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
             {/* View Toggle */}
             {activeTab !== 'batches' && (
               <div className="hidden lg:flex items-center p-1 bg-gray-100/50 rounded-lg border border-gray-200/50">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                      <LayoutGrid size={16} />
                  </button>
                  <button 
                     onClick={() => setViewMode('list')}
                     className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                      <ListIcon size={16} />
                  </button>
               </div>
             )}

             <div className="h-6 w-px bg-gray-200 hidden lg:block"></div>

             <button 
               onClick={handleStartReview}
               className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium text-sm shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
             >
                <Play size={16} fill="currentColor" />
                <span>开始复习</span>
             </button>
          </div>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex flex-1 max-w-[1920px] w-full mx-auto relative">
        
        {activeTab !== 'batches' && (
           <Sidebar filters={filters} setFilters={setFilters} allTags={ALL_TAGS} counts={counts} availableSources={availableSources} />
        )}

        <main className={`flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto pb-32 ${activeTab === 'batches' ? 'bg-white' : ''}`}>
          
          {activeTab === 'batches' ? (
             <div className="max-w-6xl mx-auto animate-fadeIn">
                 <div className="flex items-center justify-between mb-8">
                     <div>
                        <h2 className="text-2xl font-bold text-gray-900">我的复习集</h2>
                        <p className="text-gray-500 mt-1">创建针对性复习计划，提升薄弱环节</p>
                     </div>
                     <button onClick={handleOpenBatchModal} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm">
                         <Plus size={16} />
                         新建复习集
                     </button>
                 </div>

                 {reviewBatches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {reviewBatches.map(batch => (
                           <div key={batch.id} className="group border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all duration-300 bg-white relative">
                               <div className="flex justify-between items-start mb-6">
                                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                       <Folder size={24} />
                                   </div>
                                   <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                       <button onClick={(e) => { e.preventDefault(); handleStartEdit(e, batch); handleOpenBatchModal(); }} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600">
                                           <Pencil size={16} />
                                       </button>
                                       <button onClick={(e) => handleDeleteBatch(e, batch.id)} className="p-2 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600">
                                            <Trash2 size={16} />
                                       </button>
                                   </div>
                               </div>
                               
                               <h3 className="text-lg font-bold text-gray-900 mb-1">{batch.name}</h3>
                               <p className="text-gray-500 text-sm mb-6">{batch.mistakeIds.length} 个题目待复习</p>

                               <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                                   <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                       <Calendar size={12} />
                                       {new Date(batch.createdAt).toLocaleDateString()}
                                   </span>
                                   <button className="text-sm font-medium text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all">
                                       开始练习 <ChevronRight size={14} />
                                   </button>
                               </div>
                           </div>
                       ))}
                    </div>
                 ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                         <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                             <FolderPlus size={32} className="text-gray-400" />
                         </div>
                         <h3 className="text-lg font-bold text-gray-900">暂无复习集</h3>
                         <p className="text-gray-500 mt-2 mb-6">将错题添加到复习集，进行专项训练</p>
                         <button onClick={handleOpenBatchModal} className="text-indigo-600 font-medium hover:underline">
                             立即创建
                         </button>
                    </div>
                 )}
             </div>
          ) : (
             <>
                {/* Top Control Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex w-full max-w-xl gap-2">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input 
                        type="text" 
                        placeholder="搜索知识点、题目描述..." 
                        className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </div>
                    <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-indigo-500/20 transition-all active:scale-95 whitespace-nowrap">
                        搜索
                    </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {(filters.selectedSources.length > 0 || filters.selectedTypes.length > 0 || filters.selectedTags.length > 0 || filters.search || filters.showFavorites || filters.showIgnored) && (
                            <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors">
                                <FilterX size={14} />
                                清除筛选
                            </button>
                        )}
                        
                        {/* Sort Dropdown */}
                        <div className="relative" ref={sortMenuRef}>
                            <button 
                                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                                className="flex items-center gap-2 text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm min-w-[140px] justify-between"
                            >
                                <span>{getSortLabel(sortBy)}</span>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isSortMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 animate-fadeIn">
                                    <button 
                                        onClick={() => { setSortBy('recent'); setIsSortMenuOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between group ${sortBy === 'recent' ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}
                                    >
                                        <span>最近更新</span>
                                        {sortBy === 'recent' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                                    </button>
                                    <button 
                                        onClick={() => { setSortBy('mastery_asc'); setIsSortMenuOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between group ${sortBy === 'mastery_asc' ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <ArrowUpNarrowWide size={14} className="text-gray-400 group-hover:text-indigo-500" />
                                            <span>掌握度 (低到高)</span>
                                        </div>
                                        {sortBy === 'mastery_asc' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                                    </button>
                                    <button 
                                        onClick={() => { setSortBy('count_desc'); setIsSortMenuOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between group ${sortBy === 'count_desc' ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <ArrowDownWideNarrow size={14} className="text-gray-400 group-hover:text-indigo-500" />
                                            <span>错误次数 (多到少)</span>
                                        </div>
                                        {sortBy === 'count_desc' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Banner for Ignored View */}
                {filters.showIgnored && (
                    <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-between animate-fadeIn">
                        <div className="flex items-center gap-3 text-gray-600">
                             <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-200 shadow-sm">
                                <EyeOff size={16} />
                             </div>
                             <div>
                                 <h3 className="text-sm font-bold text-gray-900">回收站 / 已忽略</h3>
                                 <p className="text-xs text-gray-500">这里显示的是您选择隐藏的错题。您可以随时恢复它们。</p>
                             </div>
                        </div>
                        <button 
                            onClick={() => setFilters(prev => ({ ...prev, showIgnored: false }))}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            退出查看
                        </button>
                    </div>
                )}

                {/* Stats Summary & Select All */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <BrainCircuit size={16} className="text-indigo-500" />
                            <span>共筛选出 <strong className="text-gray-900">{sortedData.length}</strong> 道需要复习的题目</span>
                        </div>
                    </div>
                    
                    {sortedData.length > 0 && (
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600 hover:text-gray-900">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedIds.size === sortedData.length && sortedData.length > 0 ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                                    {selectedIds.size === sortedData.length && sortedData.length > 0 && <Check size={10} className="text-white" strokeWidth={3} />}
                                </div>
                                <input type="checkbox" className="sr-only" checked={selectedIds.size === sortedData.length && sortedData.length > 0} onChange={selectAll} />
                                全选当前页
                            </label>
                        </div>
                    )}
                </div>

                {/* Content Grid */}
                {sortedData.length > 0 ? (
                    <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6' : 'grid-cols-1'}`}>
                        {sortedData.map(item => (
                            <MistakeCard 
                                key={item.id} 
                                item={item} 
                                onToggleFavorite={toggleFavorite}
                                onIgnore={toggleIgnore}
                                onUpdate={handleUpdateMistake}
                                isSelected={selectedIds.has(item.id)}
                                onToggleSelection={toggleSelection}
                                selectionMode={selectedIds.size > 0}
                                viewMode={viewMode}
                                onClick={() => {
                                   if (selectedIds.size === 0) setViewingMistakeId(item.id);
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="min-h-[400px] flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 rotate-3">
                            <Search className="text-gray-300" size={28} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">未找到相关错题</h3>
                        <p className="text-gray-500 mt-2 max-w-sm mx-auto text-sm">
                             {availableSources.length > 0 
                                ? '当前分类下没有符合条件的题目。试着调整关键词或清除筛选条件。' 
                                : '请选择一个分类开始查看错题。'}
                        </p>
                        <button onClick={clearFilters} className="mt-6 px-5 py-2 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors">
                            重置所有筛选
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {sortedData.length > 0 && (
                        <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6">
                            <p className="text-sm text-gray-500">
                                当前显示第 <span className="font-medium text-gray-900">1</span> 页
                            </p>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed bg-gray-50">上一页</button>
                                <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white hover:border-gray-300 transition-colors">下一页</button>
                            </div>
                        </div>
                )}
             </>
          )}

        </main>
        
        {/* Floating Bulk Action Bar */}
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform ${selectedIds.size > 0 ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
            <div className="bg-white border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl px-6 py-3 flex items-center gap-6">
                <div className="flex items-center gap-3 border-r border-gray-200 pr-6">
                    <div className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-md min-w-[24px] text-center">
                        {selectedIds.size}
                    </div>
                    <span className="text-sm font-medium text-gray-700">已选择</span>
                    <button onClick={clearSelection} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={16} />
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <button onClick={handleOpenBatchModal} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group">
                        <FolderPlus size={16} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                        加入复习集
                    </button>
                    <button onClick={handleBulkMaster} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group">
                        <CheckCircle2 size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
                        标记掌握
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                    
                    {/* Only show Ignore if NOT in ignored view */}
                    {!filters.showIgnored ? (
                        <button onClick={handleBulkIgnore} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <EyeOff size={16} />
                            忽略
                        </button>
                    ) : (
                         <button onClick={handleBulkIgnore} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="批量恢复暂不支持，请逐个恢复">
                             <Eye size={16} />
                             (不支持批量恢复)
                         </button>
                    )}

                    <button onClick={handleBulkDelete} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                        删除
                    </button>
                </div>
            </div>
        </div>

        {/* Batch Selection Modal */}
        {isBatchModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100" onClick={(e) => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                            <FolderPlus size={20} className="text-indigo-600" />
                            {editingBatchId ? '管理复习集' : '添加到复习集'}
                        </h3>
                        <button 
                            onClick={() => setIsBatchModalOpen(false)} 
                            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        {/* New Batch Input */}
                        {!editingBatchId && (
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">新建复习集</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Plus size={16} className="text-gray-400" />
                                    </div>
                                    <input 
                                        type="text"
                                        value={newBatchName}
                                        onChange={(e) => { 
                                            setNewBatchName(e.target.value); 
                                            setSelectedBatchId(null); 
                                        }}
                                        placeholder="例如：考前冲刺、React 专项..."
                                        className={`block w-full pl-9 pr-12 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${newBatchName.length > 50 ? 'border-rose-300 focus:border-rose-500' : 'border-gray-200 focus:border-indigo-500'}`}
                                    />
                                    <div className={`absolute inset-y-0 right-0 pr-3 flex items-center text-xs ${newBatchName.length > 50 ? 'text-rose-500 font-medium' : 'text-gray-400'}`}>
                                        {newBatchName.length}/50
                                    </div>
                                </div>
                                {newBatchName.length > 50 && (
                                    <p className="text-xs text-rose-500 mt-1 ml-1">名称不能超过 50 个字符</p>
                                )}
                            </div>
                        )}

                        {/* Divider */}
                        {!editingBatchId && (
                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-100"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-2 bg-white text-xs text-gray-400 font-medium uppercase tracking-wider">或选择已有</span>
                                </div>
                            </div>
                        )}

                        {/* Existing Batches List */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {editingBatchId ? '编辑复习集' : '已有复习集'}
                            </label>
                            <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {reviewBatches.length > 0 ? (
                                    reviewBatches.map(batch => (
                                        <div 
                                            key={batch.id}
                                            onClick={() => { 
                                                if (editingBatchId) return; // Prevent selection while editing
                                                setSelectedBatchId(batch.id); 
                                                setNewBatchName(''); 
                                            }}
                                            className={`group p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all duration-200 ${
                                                selectedBatchId === batch.id 
                                                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 shadow-sm' 
                                                    : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {editingBatchId === batch.id ? (
                                                <div className="flex-1 flex flex-col gap-1 w-full" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center gap-2 w-full">
                                                        <input 
                                                            type="text"
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            className={`flex-1 py-1.5 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white ${editingName.length > 50 ? 'border-rose-300 focus:border-rose-500' : 'border-indigo-300 focus:border-indigo-500'}`}
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveBatchName(e as any);
                                                                if (e.key === 'Escape') handleCancelEdit(e as any);
                                                            }}
                                                        />
                                                        <button onClick={handleSaveBatchName} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors">
                                                            <Check size={16} />
                                                        </button>
                                                        <button onClick={handleCancelEdit} className="p-1.5 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                    <div className={`text-[10px] text-right px-1 ${editingName.length > 50 ? 'text-rose-500' : 'text-gray-400'}`}>
                                                        {editingName.length}/50 {editingName.length > 50 && '- 名称过长'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className={`p-2 rounded-lg ${selectedBatchId === batch.id ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'} transition-colors`}>
                                                            <Folder size={16} />
                                                        </div>
                                                        <div className="flex flex-col truncate">
                                                            <span className={`text-sm font-medium truncate ${selectedBatchId === batch.id ? 'text-indigo-900' : 'text-gray-700'}`}>{batch.name}</span>
                                                            <span className="text-xs text-gray-400">{batch.mistakeIds.length} 个题目</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1">
                                                         {selectedBatchId === batch.id && !editingBatchId && (
                                                            <div className="text-indigo-600 mr-2">
                                                                <CheckCircle2 size={18} fill="currentColor" className="text-white" />
                                                            </div>
                                                        )}
                                                        
                                                        {/* Action Buttons - Show on hover or if active */}
                                                        <div className={`flex items-center opacity-0 group-hover:opacity-100 transition-opacity ${selectedBatchId === batch.id ? 'opacity-100' : ''}`}>
                                                            <button 
                                                                onClick={(e) => handleStartEdit(e, batch)}
                                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                                title="重命名"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => handleDeleteBatch(e, batch.id)}
                                                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                                title="删除"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                                        <p className="text-sm text-gray-500">暂无复习集，请新建一个吧！</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 border-t border-gray-100">
                        <button 
                            onClick={() => setIsBatchModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleSaveToBatch}
                            disabled={(!newBatchName.trim() && !selectedBatchId) || (newBatchName.length > 50)}
                            className={`px-5 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-all flex items-center gap-2 ${
                                (!newBatchName.trim() && !selectedBatchId) || (newBatchName.length > 50)
                                    ? 'bg-indigo-300 cursor-not-allowed' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/25 active:translate-y-0.5'
                            }`}
                        >
                            <Check size={16} strokeWidth={3} />
                            {newBatchName.trim() ? '创建并添加' : '确认添加'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Confirmation Modal */}
        {confirmConfig.isOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fadeIn">
                 <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6 text-center">
                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                            confirmConfig.type === 'delete' ? 'bg-rose-100 text-rose-600' : 
                            confirmConfig.type === 'ignore' ? 'bg-gray-100 text-gray-600' :
                            'bg-emerald-100 text-emerald-600'
                        }`}>
                            {confirmConfig.type === 'delete' && <Trash2 size={24} />}
                            {confirmConfig.type === 'master' && <CheckCircle2 size={24} />}
                            {confirmConfig.type === 'ignore' && <EyeOff size={24} />}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {confirmConfig.type === 'delete' && '确认删除？'}
                            {confirmConfig.type === 'master' && '确认标记为已掌握？'}
                            {confirmConfig.type === 'ignore' && '确认忽略/隐藏？'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            {confirmConfig.type === 'delete' && `您即将永久删除选中的 ${confirmConfig.count} 个错题，此操作无法撤销。`}
                            {confirmConfig.type === 'master' && `这将把选中的 ${confirmConfig.count} 个错题的掌握度设置为 100%。`}
                            {confirmConfig.type === 'ignore' && `这将隐藏选中的 ${confirmConfig.count} 个错题。它们将不再显示在列表中，但不会被删除。`}
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={() => setConfirmConfig({ isOpen: false, type: null, count: 0 })}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex-1"
                            >
                                取消
                            </button>
                            <button 
                                onClick={executeBulkAction}
                                className={`px-4 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all flex-1 ${
                                    confirmConfig.type === 'delete' ? 'bg-rose-600 hover:bg-rose-700' :
                                    confirmConfig.type === 'ignore' ? 'bg-gray-600 hover:bg-gray-700' :
                                    'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                            >
                                {confirmConfig.type === 'delete' && '确认删除'}
                                {confirmConfig.type === 'master' && '确认掌握'}
                                {confirmConfig.type === 'ignore' && '确认隐藏'}
                            </button>
                        </div>
                    </div>
                 </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default App;