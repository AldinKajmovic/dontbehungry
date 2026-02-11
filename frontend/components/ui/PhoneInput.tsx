'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CountryCode, getCountries, getCountryCallingCode } from 'libphonenumber-js';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onCountryChange?: (country: CountryCode) => void;
  selectedCountry: CountryCode;
  error?: string;
  label?: string;
  hint?: string;
}

// Country data with flags
const countries = getCountries().map(code => ({
  code: code as CountryCode,
  name: new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code,
  dialCode: `+${getCountryCallingCode(code as CountryCode)}`,
})).sort((a, b) => a.name.localeCompare(b.name));

// Popular countries to show at top
const popularCountryCodes: CountryCode[] = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'IN', 'BR', 'MX', 'JP'];
const popularCountries = popularCountryCodes.map(code => countries.find(c => c.code === code)!).filter(Boolean);
const otherCountries = countries.filter(c => !popularCountryCodes.includes(c.code));

type CountryItem = { code: CountryCode | 'DIVIDER'; name: string; dialCode: string };
const sortedCountries: CountryItem[] = [
  ...popularCountries,
  { code: 'DIVIDER', name: '──────────', dialCode: '' },
  ...otherCountries
];

function getFlagEmoji(countryCode: string): string {
  if (countryCode === 'DIVIDER') return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  onCountryChange,
  selectedCountry,
  error,
  label,
  hint,
}: PhoneInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedCountryData = countries.find(c => c.code === selectedCountry);

  const filteredCountries = sortedCountries.filter(c =>
    c.code === 'DIVIDER' ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dialCode.includes(search)
  );

  // Selectable items only (no dividers)
  const selectableItems = filteredCountries.filter(c => c.code !== 'DIVIDER');

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightedIndex(selectableItems.length === 1 ? 0 : -1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const selectCountry = useCallback((code: CountryCode) => {
    onCountryChange?.(code);
    setShowDropdown(false);
    setSearch('');
    setHighlightedIndex(-1);
  }, [onCountryChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectableItems.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => {
        const next = prev < selectableItems.length - 1 ? prev + 1 : 0;
        // Scroll highlighted item into view
        const code = selectableItems[next].code;
        listRef.current?.querySelector(`[data-country="${code}"]`)?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => {
        const next = prev > 0 ? prev - 1 : selectableItems.length - 1;
        const code = selectableItems[next].code;
        listRef.current?.querySelector(`[data-country="${code}"]`)?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < selectableItems.length) {
        selectCountry(selectableItems[highlightedIndex].code as CountryCode);
      } else if (selectableItems.length === 1) {
        selectCountry(selectableItems[0].code as CountryCode);
      }
    }
  }, [selectableItems, highlightedIndex, selectCountry]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = () => {
      setShowDropdown(false);
      setSearch('');
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showDropdown]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
          {label}
          {hint && <span className="text-gray-400 dark:text-neutral-500 font-normal"> {hint}</span>}
        </label>
      )}
      <div className="flex gap-2">
        {/* Country selector */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className="flex items-center gap-1 px-3 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors min-w-[100px]"
          >
            <span className="text-lg">{getFlagEmoji(selectedCountry)}</span>
            <span className="text-sm text-gray-600 dark:text-neutral-400">{selectedCountryData?.dialCode}</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Country dropdown */}
          {showDropdown && (
            <div
              className="absolute z-50 top-full left-0 mt-1 w-64 max-h-64 overflow-auto bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-700 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search */}
              <div className="sticky top-0 bg-white dark:bg-neutral-800 p-2 border-b border-gray-100 dark:border-neutral-700">
                <input
                  type="text"
                  placeholder="Search country..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  autoFocus
                />
              </div>
              {/* Country list */}
              <div className="py-1" ref={listRef}>
                {filteredCountries.map((country, idx) => {
                  if (country.code === 'DIVIDER') {
                    return <div key={`divider-${idx}`} className="px-3 py-1 text-xs text-gray-400 dark:text-neutral-500">{country.name}</div>;
                  }
                  const selectableIdx = selectableItems.findIndex(c => c.code === country.code);
                  const isHighlighted = selectableIdx === highlightedIndex;
                  return (
                    <button
                      key={country.code}
                      type="button"
                      data-country={country.code}
                      onClick={() => selectCountry(country.code as CountryCode)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors ${selectedCountry === country.code ? 'bg-primary-50 dark:bg-primary-950/30' : ''} ${isHighlighted ? 'bg-gray-100 dark:bg-neutral-600' : ''}`}
                    >
                      <span className="text-lg">{getFlagEmoji(country.code)}</span>
                      <span className="flex-1 text-sm text-gray-700 dark:text-neutral-300 truncate">{country.name}</span>
                      <span className="text-sm text-gray-400 dark:text-neutral-500">{country.dialCode}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Phone input */}
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={`input-field flex-1 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
          placeholder="Phone number"
          autoComplete="tel-national"
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 animate-fade-in">{error}</p>
      )}
    </div>
  );
}
