import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { matchKeywordFlexible } from './searchAndFilterHelper';

/**
 * Thanh tìm kiếm kèm gợi ý dropdown linh hoạt (hỗ trợ chữ hoa, chữ thường,
 * không dấu, chữ bị dính liền, chữ kèm số, và chữ hoa/thường lẫn lộn).
 */
export default function SearchableDropdownInput({
  value = '',
  onChange,
  options = [],
  placeholder = '',
  title = '',
  className = '',
  required = false,
  id,
  name,
  autoComplete = 'off',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);

  const uniqueOptions = useMemo(() => {
    const seen = new Set();
    const list = [];
    (options || []).forEach((opt) => {
      const text = opt === undefined || opt === null ? '' : String(opt).trim();
      if (text && !seen.has(text)) {
        seen.add(text);
        list.push(text);
      }
    });
    return list;
  }, [options]);

  const filteredOptions = useMemo(() => {
    const q = String(value || '').trim();
    if (!q || !isFiltering) return uniqueOptions;
    return uniqueOptions.filter((opt) => matchKeywordFlexible({ label: opt }, q, ['label']));
  }, [uniqueOptions, value, isFiltering]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsFiltering(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (opt) => {
    if (onChange) onChange(opt);
    setIsOpen(false);
    setIsFiltering(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }
    if (!isOpen || filteredOptions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % filteredOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev <= 0 ? filteredOptions.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
      e.preventDefault();
      handleSelectOption(filteredOptions[highlightIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsFiltering(false);
      setHighlightIndex(-1);
    }
  };

  const hasValue = Boolean(value && String(value).length > 0);

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <input
        id={id}
        name={name}
        type="text"
        required={required}
        autoComplete={autoComplete}
        value={value}
        title={title}
        placeholder={placeholder}
        onFocus={() => {
          setIsOpen(true);
          setIsFiltering(Boolean(value && !uniqueOptions.includes(String(value).trim())));
        }}
        onClick={() => setIsOpen(true)}
        onChange={(e) => {
          const nextVal = e.target.value;
          setIsOpen(true);
          setIsFiltering(Boolean(nextVal && nextVal.trim()));
          setHighlightIndex(-1);
          if (onChange) onChange(nextVal);
        }}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        className={`${className} placeholder:text-slate-400 placeholder:font-normal !pr-11`}
      />

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
        {hasValue && (
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              if (onChange) onChange('');
              setIsFiltering(false);
              setIsOpen(true);
              setHighlightIndex(-1);
            }}
            title="Xóa nhanh nội dung đang nhập"
            className="p-0.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => {
              const next = !prev;
              if (next) setIsFiltering(false);
              return next;
            });
          }}
          title="Mở danh sách gợi ý"
          className="p-0.5 rounded-md text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
        </button>
      </div>

      {isOpen && uniqueOptions.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl py-1 text-xs text-slate-800"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-slate-400 italic select-none">
              Không có gợi ý trùng khớp — nhấn giữ nội dung để lọc theo từ khóa đã nhập
            </li>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = String(value || '').trim() === opt;
              const isHighlighted = idx === highlightIndex;
              return (
                <li
                  key={`${opt}-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectOption(opt);
                  }}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  className={`px-3 py-2 cursor-pointer transition-colors truncate ${
                    isHighlighted
                      ? 'bg-blue-50 text-blue-800 font-semibold'
                      : isSelected
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                  }`}
                  title={opt}
                >
                  {opt}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
