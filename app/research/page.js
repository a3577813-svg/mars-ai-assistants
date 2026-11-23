'use client';
import { useEffect, useState } from 'react';
const fields=[['project','Название проекта'],['grade','Класс (5–11)'],['role','Роль в проекте'],['topic','Тема исследования'],['problem','Проблема / исследовательский вопрос'],['object','Объект'],['subject','Предмет'],['goal','Цель исследования'],['tasks','Задачи исследования'],['methods','Методы исследования'],['sources','Ссылки на уже найденные статьи (необязательно)']];
export default function ResearchPage(){
 const [chat,setChat]=useState([]); const [chatInput,setChatInput]=useState(''); const [chatBusy,setChatBusy]=useState(false); const [sourceBusy,setSourceBusy]=useState(false); const [sourceText,setSourceText]=useState(''); const [passportReady,setPassportReady]=useState(false); const [accessCode,setAccessCode]=useState(''); const [mode,setMode]=useState('student'); const [form,setForm]=useState({}); const [id,setId]=useState(''); const [status,setStatus]=useState(''); const [report,setReport]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
 useEffect(()=>{try{const s=JSON.parse(localStorage.getItem('mars_research_draft')||'{}');setForm(s.form||{project:localStorage.getItem('mars_project')||''});setMode(s.mode||'student');setId(s.id||'');setReport(s.report||'');setStatus(s.status||'');setChat(s.chat||[]);setSourceText(s.sourceText||'');setPassportReady(!!s.passportReady);}catch{}},[]);
 useEffect(()=>{localStorage.setItem('mars_research_draft',JSON.stringify({mode,form,id,report,status,chat,sourceText,passportReady}));},[mode,form,id,report,status,chat,sourceText,passportReady]);
 useEffect(()=>{if(!id||!['in_progress','queued','running'].includes(status))return;let active=true;async function check(){try{const r=await fetch('/api/research?id='+encodeURIComponent(id),{cache:'no-store',headers:{'x-mars-research-code':accessCode}});const d=await r.json();if(!active)return;if(!r.ok)throw Error(d.error);setStatus(d.status);if(d.report)setReport(d.report);if(d.error)setError(d.error);}catch(e){if(active)setError(e.message);}}check();const timer=setInterval(check,12000);return()=>{active=false;clearInterval(timer)}},[id,status,accessCode]);
 async function start(e){e.preventDefault();if(!window.confirm('Запустить платное исследование Gemini Deep Research по согласованной теме?'))return;setLoading(true);setError('');setReport('');setId('');try{const r=await fetch('/api/research',{method:'POST',headers:{'Content-Type':'application/json','x-mars-research-code':accessCode},body:JSON.stringify({...form,mode})});const d=await r.json();if(!r.ok)throw Error(d.error);setId(d.id);setStatus(d.status);}catch(e){setError(e.message)}finally{setLoading(false)}}
 async function sendChat(e){e.preventDefault();const text=chatInput.trim();if(!text||chatBusy)return;const next=[...chat,{role:'user',content:text}];setChat(next);setChatInput('');setChatBusy(true);setError('');try{const r=await fetch('/api/research/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:next,context:form})});const d=await r.json();if(!r.ok)throw Error(d.error);setChat([...next,{role:'assistant',content:d.text}]);if(d.passport){setForm(f=>({...f,...d.passport}));setPassportReady(true);}}catch(e){setError(e.message)}finally{setChatBusy(false)}}
 async function searchSources(){if(!form.topic){setError('Сначала согласуйте тему и исследовательский паспорт.');return;}setSourceBusy(true);setError('');try{const r=await fetch('/api/research/sources',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:form.topic,goal:form.goal,tasks:form.tasks})});const d=await r.json();if(!r.ok)throw Error(d.error);setSourceText(d.text);}catch(e){setError(e.message)}finally{setSourceBusy(false)}}
 function downloadPassport(){const text=Object.entries(form).map(([key,value])=>key.toUpperCase()+': '+value).join('\\n\\n')+'\\n\\nИСТОЧНИКИ:\\n'+sourceText;const blob=new Blob([text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='МАРС_исследовательский_паспорт.txt';a.click();URL.revokeObjectURL(url)}
 const update=(key,value)=>setForm(f=>({...f,[key]:value}));
 return <main className="chat-shell" style={{maxWidth:1000,margin:'0 auto',padding:'24px 18px'}}>
 <a href="/" className="back-link">← Все ассистенты</a>
 <h1 style={{marginTop:22}}>🔬 AI-исследователь МАРС</h1>
 <p>От проектной задачи к научному отчёту. Gemini Deep Research — основной исследовательский движок. Статьи КиберЛенинки — приоритет.</p>
 <div style={{display:'flex',gap:10,margin:'20px 0'}}>
 <button type="button" className="ghost-button" onClick={()=>setMode('student')} style={{fontWeight:mode==='student'?800:400}}>Учебный режим</button>
 <button type="button" className="ghost-button" onClick={()=>setMode('teacher')} style={{fontWeight:mode==='teacher'?800:400}}>Профессиональный режим</button></div>
 <p style={{fontSize:14}}>{mode==='student'?'Школьник вместе с тьютором формулирует аппарат и анализирует результаты. Итог Gemini — исследовательские материалы, которые нужно осмыслить и проверить.':'Педагог согласовывает аппарат, Gemini готовит развёрнутый аналитический отчёт для экспертной проверки.'}</p>
 {mode==='student' && <section style={{display:'grid',gap:16,marginTop:20}}>
  <div style={{padding:18,border:'1px solid #d9d2f5',borderRadius:14,background:'#faf8ff'}}>
   <h2>Шаг 1. Диалог с исследовательским тьютором</h2>
   <p>Начни с рассказа о своём проекте и роли. Тьютор поможет выбрать тему и последовательно сформулировать научный аппарат. Gemini здесь не запускается.</p>
   <div aria-live="polite" style={{display:'grid',gap:12,maxHeight:500,overflowY:'auto',padding:'12px 0'}}>
    <div style={{background:'white',padding:12,borderRadius:10}}>Привет! В каком ты классе, над каким проектом работаешь и какая у тебя роль?</div>
    {chat.map((m,i)=><div key={i} style={{padding:12,borderRadius:10,whiteSpace:'pre-wrap',background:m.role==='user'?'#e8ddff':'white'}}><strong>{m.role==='user'?'Ты':'AI-тьютор'}</strong><div>{m.content}</div></div>)}
   </div>
   <form onSubmit={sendChat} style={{display:'grid',gap:8,marginTop:12}}>
    <textarea rows={3} value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Напиши ответ тьютору…" style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #aaa',font:'inherit'}}/>
    <button type="submit" disabled={chatBusy||!chatInput.trim()} style={{padding:12,borderRadius:10,background:'#4b20c8',color:'white',border:0}}>{chatBusy?'Тьютор отвечает…':'Отправить тьютору'}</button>
   </form>
  </div>
  <div style={{padding:18,border:'1px solid #d9d2f5',borderRadius:14}}>
   <h2>Шаг 2. Исследовательский паспорт</h2>
   <p>{passportReady?'Паспорт сформирован по согласованным ответам. Проверь данные перед передачей педагогу.':'Паспорт появится после согласования темы и аппарата в диалоге. Пока его не нужно заполнять вручную.'}</p>
   {passportReady&&<div style={{display:'grid',gap:10}}>{fields.filter(([key])=>key!=='sources').map(([key,label])=><label key={key} style={{display:'grid',gap:5}}><strong>{label}</strong><textarea rows={2} value={form[key]||''} onChange={e=>update(key,e.target.value)} style={{width:'100%',padding:10,borderRadius:8,border:'1px solid #aaa'}}/></label>)}</div>}
  </div>
  <div style={{padding:18,border:'1px solid #d9d2f5',borderRadius:14}}>
   <h2>Шаг 3. Научные статьи КиберЛенинки</h2>
   <p>Поиск через OpenAI с веб-поиском. Ссылки и библиографические данные нужно проверять по оригинальным страницам статей.</p>
   <button type="button" disabled={!passportReady||sourceBusy} onClick={searchSources} className="ghost-button">{sourceBusy?'Ищем публикации…':'Найти статьи по согласованной теме'}</button>
   {sourceText&&<><div style={{whiteSpace:'pre-wrap',marginTop:14,overflowWrap:'anywhere'}}>{sourceText}</div><button type="button" className="ghost-button" onClick={()=>setChat(c=>[...c,{role:'assistant',content:'Найдены научные источники для разбора:\\n'+sourceText.slice(0,10000)}])}>Передать подборку тьютору для обсуждения</button></>}
  </div>
  <div style={{padding:18,border:'1px solid #d9d2f5',borderRadius:14}}>
   <h2>Шаг 4. Передача педагогу</h2>
   <p>Сохрани паспорт и подборку источников, передай файл педагогу. Только педагог запускает платное исследование Gemini.</p>
   <button type="button" disabled={!passportReady} className="ghost-button" onClick={downloadPassport}>Скачать исследовательский паспорт</button>
  </div>
 </section>}
 {mode==='teacher' && <>
 <form onSubmit={start} style={{display:'grid',gap:14,marginTop:20}}><label style={{display:'grid',gap:6}}><strong>Код доступа МАРС к платным исследованиям</strong><input type="password" autoComplete="off" value={accessCode} onChange={e=>setAccessCode(e.target.value)} required style={{padding:12,borderRadius:10,border:'1px solid #aaa'}}/></label>
 {fields.map(([key,label])=><label key={key} style={{display:'grid',gap:6}}><strong>{label}</strong><textarea rows={['problem','tasks','sources'].includes(key)?3:2} value={form[key]||''} onChange={e=>update(key,e.target.value)} placeholder={key==='sources'?'https://cyberleninka.ru/article/...':''} style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #aaa',font:'inherit'}}/></label>)}
 <p style={{fontSize:13}}>Перед запуском проверьте связность объекта, предмета, цели, задач и методов. Исследование может занимать несколько минут и тарифицируется Google отдельно.</p>
 <button type="submit" disabled={loading||!!id&&['in_progress','queued','running'].includes(status)} style={{padding:14,borderRadius:10,background:'#4b20c8',color:'white',fontWeight:700,border:0,cursor:'pointer'}}>{loading?'Запуск…':'Запустить Gemini Deep Research'}</button>
 </form>
 </>}
 {id&&<section style={{marginTop:25,padding:16,border:'1px solid #aaa',borderRadius:12}}><h2>Исследование</h2><p>Статус: <strong>{status}</strong></p><p style={{fontSize:12,overflowWrap:'anywhere'}}>ID: {id}</p><p>Состояние сохраняется в этом браузере. Можно вернуться на страницу позже.</p></section>}
 {error&&<p role="alert" style={{color:'#a11'}}>{error}</p>}
 {report&&<section style={{marginTop:24}}><h2>Отчёт Gemini — требует проверки источников</h2><button type="button" className="ghost-button" onClick={()=>{const blob=new Blob([report],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='МАРС_исследование.txt';a.click();URL.revokeObjectURL(url)}}>Сохранить текст отчёта</button><article style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',lineHeight:1.6,marginTop:16}}>{report}</article></section>}
 {id&&status==='completed'&&<button className="ghost-button" onClick={()=>{setId('');setReport('');setStatus('');setError('')}}>Новое исследование</button>}
 </main>;
}