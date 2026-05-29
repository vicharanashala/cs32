export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const truncate = (str, len = 200) => {
  if (!str || str.length <= len) return str || '';
  return str.slice(0, len) + '...';
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const classNames = (...classes) => classes.filter(Boolean).join(' ');

export const stripMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/!\[.*?\]\(.+?\)/g, '')
    .replace(/\n+/g, ' ')
    .trim();
};

export const extractCodeBlocks = (text) => {
  if (!text) return [];
  const blocks = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({ language: match[1] || 'text', code: match[2].trim() });
  }
  return blocks;
};

export const highlightMentions = (text) => {
  if (!text) return '';
  return text.replace(/@(\w+)/g, '<span class="text-primary-600 font-medium">@$1</span>');
};

export const highlightHashtags = (text) => {
  if (!text) return '';
  return text.replace(/#(\w+)/g, '<span class="text-primary-600">#$1</span>');
};

export const readingTime = (text) => {
  if (!text) return '< 1 min read';
  const words = text.trim().split(/\s+/).length;
  const mins = Math.ceil(words / 200);
  return mins < 1 ? '< 1 min read' : `${mins} min read`;
};
