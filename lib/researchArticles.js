// Count distinct article links submitted by the pupil, not links suggested by the AI.
export function studentArticleLinks(messages = []) {
  const links = new Set();
  for (const message of messages) {
    if (message?.role !== 'user' || typeof message.content !== 'string') continue;
    for (const match of message.content.matchAll(/https?:\/\/(?:www\.)?cyberleninka\.ru\/article\/[^\s<>\])}]+/gi)) {
      try {
        const url = new URL(match[0].replace(/[.,;!?]+$/, ''));
        if (!['cyberleninka.ru', 'www.cyberleninka.ru'].includes(url.hostname.toLowerCase())) continue;
        const path = url.pathname.replace(/\/+$/, '').toLowerCase();
        if (path.startsWith('/article/') && path.length > '/article/'.length) links.add('https://cyberleninka.ru' + path);
      } catch {}
    }
  }
  return [...links];
}
