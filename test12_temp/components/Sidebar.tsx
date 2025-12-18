import React from 'react';
import { FilterState, SourceType, MistakeType } from '../types';
import { Filter, Layers, Hash, Check, Bookmark, EyeOff } from 'lucide-react';

interface SidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  allTags: string[];
  counts: {
    sources: Record<string, number>;
    types: Record<string, number>;
    tags: Record<string, number>;
  };
  availableSources: SourceType[];
}

const Sidebar: React.FC<SidebarProps> = ({ filters, setFilters, allTags, counts, availableSources }) => {
  
  const toggleSource = (source: SourceType) => {
    setFilters(prev => {
      const exists = prev.selectedSources.includes(source);
      return {
        ...prev,
        selectedSources: exists 
          ? prev.selectedSources.filter(s => s !== source)
          : [...prev.selectedSources, source]
      };
    });
  };

  const toggleType = (type: MistakeType) => {
    setFilters(prev => {
      const exists = prev.selectedTypes.includes(type);
      return {
        ...prev,
        selectedTypes: exists 
          ? prev.selectedTypes.filter(t => t !== type)
          : [...prev.selectedTypes, type]
      };
    });
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
        ...prev,
        selectedTags: prev.selectedTags.includes(tag) 
          ? prev.selectedTags.filter(t => t !== tag)
          : [...prev.selectedTags, tag]
    }));
  };

  const toggleFavorites = () => {
    setFilters(prev => ({
      ...prev,
      showFavorites: !prev.showFavorites
    }));
  };

  const toggleIgnored = () => {
    setFilters(prev => ({
      ...prev,
      showIgnored: !prev.showIgnored
    }));
  };

  return (
    <div className="w-72 bg-white border-r border-gray-100 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto custom-scrollbar hidden lg:block p-6 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.02)]">
      
      {/* Status Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Bookmark size={16} className="text-indigo-600" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">状态</h3>
        </div>
        <div className="space-y-2">
            <label className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${filters.showFavorites ? 'bg-amber-50/60' : 'hover:bg-gray-50'}`}>
            <div className="relative flex items-center">
                <input
                type="checkbox"
                className="peer sr-only"
                checked={filters.showFavorites}
                onChange={toggleFavorites}
                />
                <div className={`w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400`}></div>
            </div>
            <span className={`text-sm select-none ${filters.showFavorites ? 'text-amber-800 font-medium' : 'text-gray-600'}`}>
                只看收藏
            </span>
            </label>

            <label className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${filters.showIgnored ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
            <div className="relative flex items-center">
                <input
                type="checkbox"
                className="peer sr-only"
                checked={filters.showIgnored}
                onChange={toggleIgnored}
                />
                <div className={`w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-600`}></div>
            </div>
            <span className={`text-sm select-none flex items-center gap-2 ${filters.showIgnored ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                <EyeOff size={14} className={filters.showIgnored ? 'text-gray-900' : 'text-gray-400'}/>
                已忽略
            </span>
            </label>
        </div>
      </div>

      {/* Source Section */}
      {availableSources.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">题目来源</h3>
          </div>
          <div className="space-y-2">
            {availableSources.map((source) => {
              const isSelected = filters.selectedSources.includes(source);
              const count = counts.sources[source] || 0;
              return (
                <label key={source} className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-indigo-50/60' : 'hover:bg-gray-50'}`}>
                  <div className="relative flex items-center mt-0.5">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={isSelected}
                      onChange={() => toggleSource(source)}
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                      {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                      <span className={`text-sm leading-tight select-none ${isSelected ? 'text-indigo-900 font-medium' : 'text-gray-600'}`}>
                      {source}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {count}
                      </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Diagnosis Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-indigo-600" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">错误类型</h3>
        </div>
        <div className="space-y-2">
          {Object.values(MistakeType).map((type) => {
             const isSelected = filters.selectedTypes.includes(type);
             const count = counts.types[type] || 0;
             return (
              <label key={type} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-indigo-50/60' : 'hover:bg-gray-50'}`}>
                 <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={isSelected}
                    onChange={() => toggleType(type)}
                  />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                    {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-between">
                    <span className={`text-sm select-none ${isSelected ? 'text-indigo-900 font-medium' : 'text-gray-600'}`}>
                    {type}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {count}
                    </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Tags Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Hash size={16} className="text-indigo-600" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">知识点</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => {
             const isSelected = filters.selectedTags.includes(tag);
             const count = counts.tags[tag] || 0;
             return (
              <button
                key={tag}
                disabled={count === 0 && !isSelected}
                className={`text-[11px] px-2.5 py-1 rounded-md border transition-all duration-200 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : count === 0 
                        ? 'bg-white border-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => toggleTag(tag)}
              >
                <span>{tag}</span>
                <span className={`text-[9px] px-1 rounded-full ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Sidebar;