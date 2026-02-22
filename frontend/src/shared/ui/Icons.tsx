import { motion } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Eye,
  Bookmark,
  Link as LinkIconLucide,
  Flag,
  Send,
  X,
  MoreVertical,
  BadgeCheck,
  Home,
  Search,
  Bell,
  Settings,
  User,
  UserPlus,
  LogOut,
  Sun,
  Moon,
  Image,
  BarChart3,
  Smile,
  Hash,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface IconProps {
  className?: string;
  filled?: boolean;
}

export function HeartIcon({ filled, className }: IconProps) {
  if (filled) {
    return (
      <motion.div
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      >
        <Heart className={className || 'w-5 h-5'} fill="currentColor" />
      </motion.div>
    );
  }
  return <Heart className={className || 'w-5 h-5'} />;
}

export function CommentIcon({ className }: IconProps) {
  return <MessageCircle className={className || 'w-5 h-5'} />;
}

export function RepostIcon({ className }: IconProps) {
  return <Repeat2 className={className || 'w-5 h-5'} />;
}

export function ViewIcon({ className }: IconProps) {
  return <Eye className={className} />;
}

export function BookmarkIcon({ filled, className }: IconProps) {
  return <Bookmark className={className || 'w-5 h-5'} fill={filled ? 'currentColor' : 'none'} />;
}

export function LinkIcon({ className }: IconProps) {
  return <LinkIconLucide className={className || 'w-5 h-5'} />;
}

export function FlagIcon({ className }: IconProps) {
  return <Flag className={className || 'w-5 h-5'} />;
}

export function SendIcon({ className }: IconProps) {
  return <Send className={className || 'w-5 h-5'} />;
}

export function CloseIcon({ className }: IconProps) {
  return <X className={className || 'w-5 h-5'} />;
}

export function MoreIcon({ className }: IconProps) {
  return <MoreVertical className={className} />;
}

export function VerifiedBadge({ className }: { className?: string }) {
  return <BadgeCheck className={className} />;
}

export function HomeIcon({ className, filled }: IconProps) {
  return <Home className={className} fill={filled ? 'currentColor' : 'none'} />;
}

export function SearchIcon({ className, filled }: IconProps) {
  return <Search className={className} strokeWidth={filled ? 2.5 : 2} />;
}

export function BellIcon({ className, filled }: IconProps) {
  return <Bell className={className} fill={filled ? 'currentColor' : 'none'} />;
}

export function SettingsIcon({ className, filled }: IconProps) {
  return <Settings className={className} fill={filled ? 'currentColor' : 'none'} />;
}

export function UserIcon({ className }: IconProps) {
  return <User className={className} />;
}

export function UserPlusIcon({ className }: IconProps) {
  return <UserPlus className={className} />;
}

export function LogoutIcon({ className }: IconProps) {
  return <LogOut className={className} />;
}

export function SunIcon({ className }: IconProps) {
  return <Sun className={className} />;
}

export function MoonIcon({ className }: IconProps) {
  return <Moon className={className} />;
}

export function ImageIcon({ className }: IconProps) {
  return <Image className={className} />;
}

export function GifIcon({ className }: IconProps) {

  return <Image className={className} />;
}

export function PollIcon({ className }: IconProps) {
  return <BarChart3 className={className} />;
}

export function EmojiIcon({ className }: IconProps) {
  return <Smile className={className} />;
}

export function HashtagIcon({ className }: IconProps) {
  return <Hash className={className} />;
}

export function ChevronLeftIcon({ className }: IconProps) {
  return <ChevronLeft className={className} />;
}

export function ChevronRightIcon({ className }: IconProps) {
  return <ChevronRight className={className} />;
}

export function ChevronDownIcon({ className }: IconProps) {
  return <ChevronDown className={className} />;
}
