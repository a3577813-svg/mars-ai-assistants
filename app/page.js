'use client';

import { useEffect, useState } from 'react';
import { roleList } from '../lib/roles';
import { roleCapabilities } from '../lib/roleCapabilities';

const MARS_LOGO = 'data:image/jpeg;base64,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';

const roleAccentClass = {
  leader: 'role-leader',
  technologist: 'role-technologist',
  assistant: 'role-marketer',
  marketer: 'role-marketer',
  analyst: 'role-analyst',
};

export default function HomePage() {
  const [name, setName] = useState('');
  const [project, setProject] = useState('');
  const [expandedRole, setExpandedRole] = useState(null);

  useEffect(() => {
    setName(localStorage.getItem('mars_name') || '');
    setProject(localStorage.getItem('mars_project') || '');
  }, []);

  function openRole(roleId) {
    localStorage.setItem('mars_name', name.trim());
    localStorage.setItem('mars_project', project.trim());
    window.location.href = `/chat?role=${roleId}`;
  }

  function toggleCapabilities(roleId) {
    setExpandedRole((current) => current === roleId ? null : roleId);
  }

  return (
    <main className="shell mars-home">
      <header className="mars-topbar">
        <div className="mars-brand">
          <img className="mars-logo" src={MARS_LOGO} alt="МАРС" />
          <div>
            <div className="mars-brand-title">ПРОЕКТНАЯ ШКОЛА</div>
            <div className="mars-brand-subtitle">AI-ассистенты проектной команды</div>
          </div>
        </div>
        <a className="mars-site-link" href="https://mars-project.ru/" target="_blank" rel="noreferrer">mars-project.ru ↗</a>
      </header>

      <section className="hero mars-hero">
        <div className="mars-orbit mars-orbit-one" aria-hidden="true" />
        <div className="mars-orbit mars-orbit-two" aria-hidden="true" />
        <div className="eyebrow">ПРОЕКТИРУЕМ БУДУЩЕЕ</div>
        <h1>Кто тебе сейчас нужен?</h1>
        <p className="lead">Выбери роль под текущую задачу проекта. Каждый ассистент работает в своей педагогической позиции.</p>
      </section>

      <section className="identity-card">
        <label>
          <span>Как тебя зовут?</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" />
        </label>
        <label>
          <span>Название проекта</span>
          <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Если проекта пока нет — можно оставить пустым" />
        </label>
      </section>

      <div className="roles-heading">
        <span>КОМАНДА ПРОЕКТА</span>
        <h2>Выбери своего ассистента</h2>
      </div>

      <section className="role-grid">
        {roleList.map((role) => {
          const capabilities = roleCapabilities[role.id] || [];
          const isExpanded = expandedRole === role.id;
          const visibleCapabilities = isExpanded ? capabilities : capabilities.slice(0, 3);
          const accentClass = roleAccentClass[role.id] || '';

          return (
            <article className={`role-card ${accentClass}${isExpanded ? ' role-card-expanded' : ''}`} key={role.id}>
              <div className="role-card-top">
                <div className="role-icon">{role.emoji}</div>
                <div className="role-dot" aria-hidden="true" />
              </div>
              <h2>{role.title}</h2>
              <p className="role-short">{role.short}</p>
              <p className="role-description">{role.description}</p>

              {visibleCapabilities.length > 0 && (
                <ol className="role-capabilities-list">
                  {visibleCapabilities.map((item, index) => <li key={index}>{item}</li>)}
                </ol>
              )}

              <div className="role-actions">
                {capabilities.length > 3 && (
                  <button
                    type="button"
                    className="role-capabilities-toggle"
                    onClick={() => toggleCapabilities(role.id)}
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? 'Свернуть список' : 'Развернуть весь список возможностей'}</span>
                    <span className="role-toggle-arrow" aria-hidden="true">{isExpanded ? '↑' : '↓'}</span>
                  </button>
                )}

                <button type="button" className="role-open-button" onClick={() => openRole(role.id)}>
                  Открыть →
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
