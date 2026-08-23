'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { roles } from '../../lib/roles';

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function FormattedMessage({ text }) {
  const lines = String(text || '').split('\n');
  return (
    <div className="formatted-message">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="message-gap" />;
        if (trimmed.startsWith('### ')) return <h4 key={index}>{renderInline(trimmed.slice(4))}</h4>;
        if (trimmed.startsWith('## ')) return <h3 key={index}>{renderInline(trimmed.slice(3))}</h3>;
        if (trimmed.startsWith('# ')) return <h3 key={index}>{renderInline(trimmed.slice(2))}</h3>;
        if (/^[-•] /.test(trimmed)) return <div key={index} className="message-list-item"><span>•</span><div>{renderInline(trimmed.slice(2))}</div></div>;
        if (/^\d+[.)] /.test(trimmed)) {
          const match = trimmed.match(/^(\d+[.)])\s+(.*)$/);
          return <div key={index} className="message-list-item"><span>{match[1]}</span><div>{renderInline(match[2])}</div></div>;
        }
        return <div key={index} className="message-paragraph">{renderInline(line)}</div>;
      })}
    </div>
  );
}

export default function ChatPage() {
  const [roleId, setRoleId] = useState('leader');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [project, setProject] = useState('');
  const bottomRef = useRef(null);

  const role = roles[roleId] || roles.leader;
  const storageKey = useMemo(() => `mars_chat_${roleId}`, [roleId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('role');
    const nextRole = roles[requested] ? requested : 'leader';
    setRoleId(nextRole);
    setName(localStorage.getItem('mars_name') || '');
    setProject(localStorage.getItem('mars_project') || '');
  }, []);

  useEffect(() => {
    if (!roleId) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setMessages(Array.isArray(saved) ? saved : []);
    } catch {
      setMessages([]);
    }
  }, [storageKey, roleId]);

  useEffect(() => {
    if (!roleId) return;
    localStorage.setItem(storageKey, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, storageKey, roleId]);

  async function sendMessage(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId, name, project, messages: next })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка запроса');
      setMessages([...next, { role: 'assistant', content: data.text }]);
    } catch (error) {
      setMessages([...next, { role: 'assistant', content: `Не получилось получить ответ. ${error.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  function clearChat() {
    if (!window.confirm('Начать новый диалог с этой ролью? Текущая история на этом устройстве будет удалена.')) return;
    setMessages([]);
    localStorage.removeItem(storageKey);
  }

  return (
    <main className="chat-shell">
      <header className="chat-header">
        <a href="/" className="back-link">← Все роли</a>
        <div className="chat-role">
          <span className="chat-role-icon">{role.emoji}</span>
          <div>
            <div className="chat-role-title">{role.title}</div>
            <div className="chat-context">{name || 'Ученик'}{project ? ` · ${project}` : ''}</div>
          </div>
        </div>
        <button className="ghost-button" onClick={clearChat}>Новый диалог</button>
      </header>

      <section className="messages">
        <div className="message assistant-message">
          <div className="message-author">{role.title}</div>
          <div>{role.greeting}</div>
        </div>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}>
            <div className="message-author">{message.role === 'user' ? (name || 'Ты') : role.title}</div>
            <div className="message-text"><FormattedMessage text={message.content} /></div>
          </div>
        ))}
        {busy && <div className="message assistant-message typing">{role.title} думает…</div>}
        <div ref={bottomRef} />
      </section>

      <form className="composer" onSubmit={sendMessage}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Напиши сообщение…"
          rows={2}
        />
        <button disabled={busy || !input.trim()} type="submit">Отправить</button>
      </form>
    </main>
  );
}
