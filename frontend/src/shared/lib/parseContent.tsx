import { NavLink } from 'react-router-dom';

export function parseContent(content: string): React.ReactNode[] {
  if (!content) return [];

  const parts: React.ReactNode[] = [];
  const regex = /(#[\wа-яёА-ЯЁ]+)|(@[\w]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const text = match[0];
    if (text.startsWith('#')) {
      const tag = text.slice(1);
      parts.push(
        <NavLink
          key={`${match.index}-${text}`}
          to={`/explore?hashtag=${encodeURIComponent(tag)}`}
          className="text-brand-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {text}
        </NavLink>
      );
    } else if (text.startsWith('@')) {
      const username = text.slice(1);
      parts.push(
        <NavLink
          key={`${match.index}-${text}`}
          to={`/${username}`}
          className="text-brand-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {text}
        </NavLink>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}
