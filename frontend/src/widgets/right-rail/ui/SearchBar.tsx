import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Search } from 'lucide-react';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch}>
      <motion.div
        animate={{ scale: isFocused ? 1.02 : 1 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <Search
          className={clsx(
            'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors',
            isFocused ? 'text-brand-primary' : 'text-muted'
          )}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Поиск"
          className={clsx(
            'w-full bg-surface rounded-full pl-12 pr-4 py-3 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-theme',
            'placeholder:text-muted text-theme'
          )}
        />
      </motion.div>
    </form>
  );
}
