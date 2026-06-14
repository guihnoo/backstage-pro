import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchAddressSuggestions } from '@/lib/geocodeAddress';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

export default function LocationAutocomplete({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Endereço, cidade ou local do evento',
  className = '',
}) {
  const { primaryHex } = useCategoryTheme();
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    setInput(value || '');
  }, [value]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const fetchSuggestions = (text) => {
    clearTimeout(debounceRef.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchAddressSuggestions(text);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleInput = (text) => {
    setInput(text);
    onChange?.(text);
    fetchSuggestions(text);
  };

  const pick = (item) => {
    setInput(item.location);
    onChange?.(item.location);
    onSelect?.(item);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="bg-slate-800 border-slate-700 pl-9 pr-9"
        />
        {loading && (
          <Loader2
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin"
            style={{ color: primaryHex }}
          />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-[110] mt-1 w-full max-h-48 overflow-y-auto overscroll-contain rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-800 border-b border-slate-800 last:border-0"
                onClick={() => pick(item)}
              >
                <span className="line-clamp-2">{item.label}</span>
                {(item.city || item.state) && (
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {[item.city, item.state].filter(Boolean).join(' — ')}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
