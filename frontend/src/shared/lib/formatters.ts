export function formatTimeAgo(dateInput: string | number): string {
  if (!dateInput) return '';

  let date: Date;

  if (typeof dateInput === 'number') {

    date = new Date(dateInput < 10000000000 ? dateInput * 1000 : dateInput);
  } else {

    const numericValue = Number(dateInput);
    if (!isNaN(numericValue) && numericValue > 0) {
      date = new Date(numericValue < 10000000000 ? numericValue * 1000 : numericValue);
    } else {

      date = new Date(dateInput);
    }
  }

  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} д. назад`;

  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function formatCount(count: number): string {
  if (count === 0) return '';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

export function formatFullDate(dateInput: string | number): string {
  if (!dateInput) return '';

  let date: Date;

  if (typeof dateInput === 'number') {
    date = new Date(dateInput < 10000000000 ? dateInput * 1000 : dateInput);
  } else {
    const numericValue = Number(dateInput);
    if (!isNaN(numericValue) && numericValue > 0) {
      date = new Date(numericValue < 10000000000 ? numericValue * 1000 : numericValue);
    } else {
      date = new Date(dateInput);
    }
  }

  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
