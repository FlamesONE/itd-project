import { motion } from 'framer-motion';
import { SearchBar } from './SearchBar';
import { TrendingHashtags } from './TrendingHashtags';
import { WhoToFollow } from './WhoToFollow';
import { TopClans } from './TopClans';

export function RightRail() {
  return (
    <div className="p-4 space-y-4">
      
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SearchBar />
      </motion.div>

      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <TopClans />
      </motion.div>

      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <TrendingHashtags />
      </motion.div>

      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <WhoToFollow />
      </motion.div>

      
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-muted space-y-1 pt-2"
      >
        <div className="flex flex-wrap gap-x-2">
          <a href="#" className="hover:underline">Условия использования</a>
          <a href="#" className="hover:underline">Конфиденциальность</a>
          <a href="#" className="hover:underline">Cookies</a>
        </div>
        <p>© 2026 итд</p>
      </motion.footer>
    </div>
  );
}
