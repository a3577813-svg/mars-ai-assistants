'use client';

import { useEffect, useState } from 'react';
import { roleList } from '../lib/roles';

export default function HomePage() {
  const [name, setName] = useState('');
  const [project, setProject] = useState('');

  useEffect(() => {
    setName(localStorage.getItem('mars_name') || '');
    setProject(localStorage.getItem('mars_project') || '');
  }, []);

  function openRole(roleId) {
    localStorage.setItem('mars_name', name.trim());
    localStorage.setItem('mars_project', project.trim());
    window.location.href = `/chat?role=${roleId}`;
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
        {roleList.map((role) => (
          <button className="role-card" key={role.id} onClick={() => openRole(role.id)}>
            <div className="role-icon">{role.emoji}</div>
            <h2>{role.title}</h2>
            <p className="role-short">{role.short}</p>
            <p className="role-description">{role.description}</p>
            <span className="role-link">Открыть →</span>
          </button>
        ))}
      </section>
    </main>
  );
}
