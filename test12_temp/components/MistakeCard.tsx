import React, { useState, useEffect } from 'react';
import { MistakeItem, MistakeType } from '../types';
import { Clock, Target, Star, Check, EyeOff, Pencil, X, Eye } from 'lucide-react';

interface MistakeCardProps {
  item: MistakeItem;
  onToggleFavorite: (id: string) => void;
  onIgnore: (id: string) => void;
  onUpdate: (item: MistakeItem) => void;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  selectionMode: boolean;
  viewMode?: 'grid' | 'list';
  onClick?: () => void;
}

const getTypeStyles = (type: MistakeType) => {
  switch (type) {
    case MistakeType.KNOWLEDGE_GAP: return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', dot: 'bg-rose-500' };
    case MistakeType.LOGIC_CONFUSION: return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500' };
    case MistakeType.INCOMPLETE: return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', dot: 'bg-purple-500' };
    case MistakeType.EXPRESSION: return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-500' };
    default: return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' };
  }
};

const MistakeCard: React.FC<MistakeCardProps> = ({ item, onToggleFavorite, onIgnore, onUpdate, isSelected, onToggleSelection, selectionMode, viewMode = 'grid', onClick }) => {
  const typeStyle = getTypeStyles(item.type);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
      question: item.question,
      snippet: item.snippet,
      tags: item.tags.join(', ')
  });

  // Sync state with props if item changes externally
  useEffect(() => {
      setEditForm({
          question: item.question,
          snippet: item.snippet,
          tags: item.tags.join(', ')
      });
  }, [item]);

  const handleStartEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(false);
      // Reset form
      setEditForm({
          question: item.question,
          snippet: item.snippet,
          tags: item.tags.join(', ')
      });
  };

  const handleSave = (e: React.MouseEvent) => {
      e.stopPropagation();
      onUpdate({
          ...item,
          question: editForm.question,
          snippet: editForm.snippet,
          tags: editForm.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
      });
      setIsEditing(false);
  };

  const handleInputChange = (field: keyof typeof editForm, value: string) => {
      setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCardClick = (e: React.MouseEvent) => {
      if (isEditing) return;
      
      // If in selection mode, toggle selection
      if (selectionMode) {
          onToggleSelection(item.id);
          return;
      }

      // Otherwise, trigger main click action (view details)
      if (onClick) {
          onClick();
      }
  };

  // --- LIST VIEW LAYOUT ---
  if (viewMode === 'list') {
    return (
      <div 
        className={`group relative bg-white rounded-lg border transition-all duration-200 hover:shadow-md hover:border-indigo-200 cursor-pointer flex items-center p-3 gap-4 ${isSelected ? 'border-indigo-500 bg-indigo-50/10' : 'border-gray-100'} ${item.isIgnored ? 'opacity-75 bg-gray-50' : ''}`}
        onClick={handleCardClick}
      >
        {/* Selection Checkbox */}
        <div 
          className={`flex-shrink-0 cursor-pointer ${selectionMode || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
          onClick={(e) => {
            e.stopPropagation();
            if(!isEditing) onToggleSelection(item.id);
          }}
          title={isSelected ? "取消选中" : "选中"}
        >
           <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white hover:border-indigo-400'}`}>
              {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
           </div>
        </div>

        {/* Question & Type */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${item.isIgnored ? 'bg-gray-100 text-gray-500 border-gray-200' : `${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}`}>
             <span className={`w-1.5 h-1.5 rounded-full ${item.isIgnored ? 'bg-gray-400' : typeStyle.dot}`}></span>
             {item.type}
          </div>
          
          {isEditing ? (
              <input 
                  type="text" 
                  value={editForm.question}
                  onChange={(e) => handleInputChange('question', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 text-sm font-semibold text-gray-900 border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
          ) : (
            <h3 className={`text-sm font-semibold truncate transition-colors ${item.isIgnored ? 'text-gray-500' : 'text-gray-900 group-hover:text-indigo-600'}`}>
                {item.question}
            </h3>
          )}
        </div>

        {/* Tags (Horizontal, limited) */}
        <div className="hidden xl:flex items-center gap-1.5 w-48 overflow-hidden">
           {isEditing ? (
              <input 
                  type="text" 
                  value={editForm.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-xs border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="标签 (逗号分隔)"
              />
           ) : (
             <>
                {item.tags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded text-nowrap">
                    #{tag}
                    </span>
                ))}
                {item.tags.length > 2 && <span className="text-[10px] text-gray-400">+{item.tags.length - 2}</span>}
             </>
           )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-xs text-gray-500 w-48 justify-end">
           <div className="flex items-center gap-1.5" title="上次复习时间">
              <Clock size={14} className="text-gray-400" />
              <span>{item.lastReviewed}</span>
           </div>
           <div className="flex items-center gap-1.5 w-20" title="掌握度">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${item.mastery < 30 ? 'bg-rose-500' : item.mastery < 70 ? 'bg-amber-400' : 'bg-emerald-500'} ${item.isIgnored ? 'opacity-50' : ''}`} 
                    style={{ width: `${item.mastery}%` }}
                />
              </div>
              <span className="text-[10px] tabular-nums">{item.mastery}%</span>
           </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 border-l border-gray-100 pl-3">
           {isEditing ? (
             <>
                <button 
                    onClick={handleSave}
                    className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 transition-colors"
                    title="保存修改"
                >
                    <Check size={16} strokeWidth={2.5} />
                </button>
                <button 
                    onClick={handleCancelEdit}
                    className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600 transition-colors"
                    title="取消编辑"
                >
                    <X size={16} strokeWidth={2.5} />
                </button>
             </>
           ) : (
             <>
                {!item.isIgnored && (
                    <button 
                        onClick={handleStartEdit}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-300 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="编辑内容"
                    >
                        <Pencil size={14} strokeWidth={2} />
                    </button>
                )}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onIgnore(item.id);
                    }}
                    className={`p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 ${item.isIgnored ? 'hover:bg-emerald-50 text-emerald-500' : 'hover:bg-gray-100 text-gray-300 hover:text-gray-500'}`}
                    title={item.isIgnored ? "恢复题目" : "忽略此题"}
                >
                    {item.isIgnored ? <Eye size={14} strokeWidth={2} /> : <EyeOff size={14} strokeWidth={2} />}
                </button>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                    }}
                    className={`p-1.5 rounded-md hover:bg-gray-50 active:scale-95 transition-all ${item.isFavorite ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}
                    title={item.isFavorite ? "取消收藏" : "加入收藏"}
                >
                    <Star 
                        size={16} 
                        fill={item.isFavorite ? "currentColor" : "none"} 
                        strokeWidth={2} 
                    />
                </button>
             </>
           )}
        </div>
      </div>
    );
  }

  // --- GRID VIEW LAYOUT (Default) ---
  return (
    <div 
      className={`group relative bg-white rounded-xl border shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 flex flex-col h-full overflow-hidden cursor-pointer ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-100 hover:border-indigo-100/50'} ${item.isIgnored ? 'opacity-75 bg-gray-50' : ''}`}
      onClick={handleCardClick}
    >
      
      {/* Top Mastery Indicator */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-50">
        <div 
            className={`h-full transition-all duration-1000 ${item.mastery < 30 ? 'bg-rose-500' : item.mastery < 70 ? 'bg-amber-400' : 'bg-emerald-500'} ${item.isIgnored ? 'bg-gray-400' : ''}`} 
            style={{ width: `${item.mastery}%` }}
        />
      </div>

      <div className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-3 mt-1">
          <div className="flex items-center gap-3">
              {/* Checkbox */}
              <div 
                className={`flex-shrink-0 transition-all duration-200 ${selectionMode || isSelected ? 'w-5 opacity-100' : 'w-0 opacity-0 group-hover:w-5 group-hover:opacity-100 overflow-hidden'}`}
                title={isSelected ? "取消选中" : "选中"}
              >
                  <div 
                    onClick={(e) => {
                        e.stopPropagation();
                        if(!isEditing) onToggleSelection(item.id);
                    }}
                    className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white hover:border-indigo-400'}`}
                  >
                      {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
              </div>

              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${item.isIgnored ? 'bg-gray-100 text-gray-500 border-gray-200' : `${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${item.isIgnored ? 'bg-gray-400' : typeStyle.dot}`}></span>
                {item.type}
              </div>
          </div>

          <div className="flex items-center gap-1">
             {isEditing ? (
                 <>
                    <button 
                        onClick={handleSave}
                        className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="保存修改"
                    >
                        <Check size={16} strokeWidth={2.5} />
                    </button>
                    <button 
                        onClick={handleCancelEdit}
                        className="p-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                        title="取消编辑"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                 </>
             ) : (
                <>
                    {!item.isIgnored && (
                        <button 
                            onClick={handleStartEdit}
                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full hover:bg-gray-100 text-gray-300 hover:text-indigo-600"
                            title="编辑内容"
                        >
                            <Pencil size={16} strokeWidth={2} />
                        </button>
                    )}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onIgnore(item.id);
                        }}
                        className={`opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full ${item.isIgnored ? 'hover:bg-emerald-50 text-emerald-500' : 'hover:bg-gray-100 text-gray-300 hover:text-gray-500'}`}
                        title={item.isIgnored ? "恢复题目" : "忽略此题"}
                    >
                         {item.isIgnored ? <Eye size={16} strokeWidth={2} /> : <EyeOff size={16} strokeWidth={2} />}
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(item.id);
                        }}
                        className={`transition-all duration-200 p-1.5 -mr-1.5 rounded-full hover:bg-gray-50 active:scale-90 ${item.isFavorite ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}
                        title={item.isFavorite ? "取消收藏" : "加入收藏"}
                    >
                        <Star 
                            size={18} 
                            fill={item.isFavorite ? "currentColor" : "none"} 
                            strokeWidth={2} 
                            className={`transition-transform duration-300 ${item.isFavorite ? 'scale-110' : 'scale-100'}`} 
                        />
                    </button>
                </>
             )}
          </div>
        </div>

        {/* Question */}
        {isEditing ? (
             <input 
                type="text"
                value={editForm.question}
                onChange={(e) => handleInputChange('question', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-base font-bold text-gray-900 mb-2 leading-snug border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
             />
        ) : (
            <h3 className={`text-base font-bold mb-2 leading-snug transition-colors line-clamp-2 ${item.isIgnored ? 'text-gray-500 decoration-gray-400' : 'text-gray-900 group-hover:text-indigo-600'}`}>
            {item.question}
            </h3>
        )}

        {/* Snippet / Context */}
        <div className="relative mb-4 flex-grow">
             {isEditing ? (
                 <textarea 
                    value={editForm.snippet}
                    onChange={(e) => handleInputChange('snippet', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-full min-h-[80px] text-xs text-gray-600 border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                 />
             ) : (
                 <>
                    <div className={`absolute left-0 top-0 bottom-0 w-0.5 transition-colors ${item.isIgnored ? 'bg-gray-200' : 'bg-gray-100 group-hover:bg-indigo-100'}`}></div>
                    <p className="text-xs text-gray-500 line-clamp-3 pl-3 leading-relaxed">
                        {item.snippet}
                    </p>
                 </>
             )}
        </div>

        {/* Tags */}
        {isEditing ? (
            <div className="mb-5">
                 <input 
                    type="text" 
                    value={editForm.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-xs border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="标签 (逗号分隔)"
                 />
                 <span className="text-[10px] text-gray-400 mt-1 block">使用逗号分隔标签</span>
            </div>
        ) : (
            <div className="flex flex-wrap gap-1.5 mb-5">
            {item.tags.map((tag, idx) => (
                <span key={idx} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md font-medium group-hover:border-gray-200 transition-colors">
                #{tag}
                </span>
            ))}
            </div>
        )}

        {/* Footer Info */}
        <div className="border-t border-dashed border-gray-100 pt-3 mt-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <div className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    <span>{item.lastReviewed}</span>
                 </div>
                 <div className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Target size={12} />
                    <span>掌握度 {item.mastery}%</span>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MistakeCard;