import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChange,
    placeholder = 'Tìm kiếm...',
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = () => {
        onChange('');
    };

    return (
        <div className={`relative transition-all ${isFocused ? 'scale-[1.02]' : ''}`}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search className="text-slate-400" size={20} />
            </div>

            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className={`w-full bg-slate-800 text-white pl-12 pr-12 py-3 rounded-xl border-2 transition-all focus:outline-none ${isFocused
                        ? 'border-lime-400 bg-slate-800/80'
                        : 'border-transparent'
                    }`}
            />

            {value && (
                <button
                    onClick={handleClear}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            )}
        </div>
    );
};
