'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Search, ChevronDown, X } from 'lucide-react';

interface Option {
  _id: string;
  name: string;
  role?: string;
  avatar?: string;
}

interface UnifiedSearchSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  multiSelect?: boolean;
  error?: string;
}

export default function UnifiedSearchSelect({
  options,
  selected,
  onChange,
  placeholder = 'Search or select...',
  multiSelect = true,
  error,
}: UnifiedSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (option) =>
      option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOptions = options.filter((opt) => selected.includes(opt._id));

  const toggleOption = (optionId: string) => {
    if (multiSelect) {
      if (selected.includes(optionId)) {
        onChange(selected.filter((id) => id !== optionId));
      } else {
        onChange([...selected, optionId]);
      }
    } else {
      onChange([selected.includes(optionId) ? '' : optionId]);
      setIsOpen(false);
    }
  };

  const removeOption = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((id) => id !== optionId));
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`input-premium cursor-pointer flex items-center gap-2 ${
          error ? 'border-red-500' : ''
        }`}
      >
        <Search className="w-4 h-4 text-text-secondary flex-shrink-0" />
        <div className="flex-1 flex items-center gap-2 flex-wrap min-h-[24px]">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((opt) => (
              <span
                key={opt._id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-xs font-medium"
              >
                {opt.avatar ? (
                  <Image
                    src={opt.avatar}
                    alt={opt.name}
                    width={16}
                    height={16}
                    className="w-4 h-4 rounded-full"
                  />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center">
                    {opt.name.charAt(0).toUpperCase()}
                  </span>
                )}
                {opt.name}
                {multiSelect && (
                  <button
                    onClick={(e) => removeOption(opt._id, e)}
                    className="hover:bg-primary-200 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))
          ) : (
            <span className="text-text-secondary text-sm">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* Search Input */}
          <div className="sticky top-0 bg-white border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Search developers..."
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option._id);
                return (
                  <div
                    key={option._id}
                    onClick={() => toggleOption(option._id)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary-50 text-primary-700'
                        : 'hover:bg-hover text-text-primary'
                    }`}
                  >
                    {option.avatar ? (
                      <Image
                        src={option.avatar}
                        alt={option.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">
                        {option.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{option.name}</div>
                      {option.role && (
                        <div className="text-xs text-text-secondary truncate">{option.role}</div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">✓</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-text-secondary text-sm">
                No developers found
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}
