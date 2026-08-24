'use client';

import { useEffect, useState } from 'react';
import { roleList } from '../lib/roles';
import { roleCapabilities } from '../lib/roleCapabilities';

const roleAccentClass = {
  leader: 'role-leader',
  technologist: 'role-technologist',
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
    <main className="shell">
      <section className="hero">
        <div className="eyebrow">ПРОЕКТНЫЕ АССИСТЕНТЫ</div>
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

      <section className="role-grid">
        {roleList.map((role) => {
          const capabilities = roleCapabilities[role.id] || [];
          const isExpanded = expandedRole === role.id;
          const visibleCapabilities = isExpanded ? capabilities : capabilities.slice(0, 3);
          const accentClass = roleAccentClass[role.id] || '';

          return (
            <article className={`role-card ${accentClass}${isExpanded ? ' role-card-expanded' : ''}`} key={role.id}>
              <div className="role-icon">{role.emoji}</div>
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
