export const runtime = 'nodejs';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const headers = () => ({ 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY || '' });
const errorText = (data) => data?.error?.message || 'Ошибка Gemini API';
export async function POST(request) {
  try {
    if (!process.env.MARS_RESEARCH_ACCESS_CODE) return Response.json({error:'Задайте MARS_RESEARCH_ACCESS_CODE в Vercel для защиты платных исследований.'},{status:503});
    if (request.headers.get('x-mars-research-code') !== process.env.MARS_RESEARCH_ACCESS_CODE) return Response.json({error:'Неверный код доступа к исследованиям.'},{status:403});
    if (!process.env.GEMINI_API_KEY) return Response.json({error:'Для запуска исследований добавьте GEMINI_API_KEY в Vercel → Settings → Environment Variables.'},{status:503});
    const body = await request.json();
    const { mode, grade, role, project, topic, problem, object, subject, goal, tasks, methods, hypothesis, expectedResult, sources } = body;
    if (mode !== 'teacher' || !topic?.trim() || !goal?.trim() || !project?.trim()) return Response.json({error:'Укажите режим, проект, тему и цель исследования.'},{status:400});
    const prompt = `Ты — Gemini Deep Research, научно-аналитический движок АНО ЦСКП «МАРС», Обнинск. Подготовь полноценный научно-аналитический отчёт на русском языке.
Режим: ${mode === 'student' ? 'учебный (материалы для самостоятельной работы школьника, не выдавай непроверенные выводы за его собственные)' : 'профессиональный (аналитика для педагога)'}. Класс: ${grade || 'не указан'}. Роль: ${role || 'не указана'}.
Проект: ${project}. Тема: ${topic}. Проблема: ${problem || 'уточнить по источникам'}. Объект: ${object || 'не задан'}. Предмет: ${subject || 'не задан'}. Цель: ${goal}. Задачи: ${tasks || 'сформулировать исходя из цели'}. Методы: ${methods || 'анализ научной литературы и сравнительный анализ'}. Гипотеза: ${hypothesis || 'не предоставлена — не придумывай подтверждение'}. Предполагаемый результат: ${expectedResult || 'не указан'}.
Источники, предоставленные пользователем (не считай их проверенными без открытия): ${sources || 'не предоставлены'}.
ОБЯЗАТЕЛЬНО: приоритет реальным научным статьям cyberleninka.ru. Ищи точные публикации, открывай тексты, сверяй авторов, названия, годы и URL. Используй дополнительные академические источники, когда необходимо. НИКОГДА не выдумывай статьи, авторов, цитаты, DOI или результаты. Отмечай недоступные тексты и неподтверждённые сведения. Если публикаций на КиберЛенинке мало, честно укажи это.
Структура: название и аннотация; исследовательский аппарат; методология и поисковые запросы; реестр источников (с прямыми URL и статусом проверки); обзор литературы; сравнительный анализ; ответы на задачи; ограничения и пробелы; практические выводы именно для проекта и роли; список литературы. Различай данные источников, интерпретации и рекомендации. Не приписывай школьнику самостоятельно не выполненную работу.`;
    const response = await fetch(BASE,{method:'POST',headers:headers(),body:JSON.stringify({agent:process.env.GEMINI_RESEARCH_AGENT || 'deep-research-preview-04-2026',input:prompt,background:true,stream:false})});
    const data = await response.json();
    if (!response.ok) return Response.json({error:errorText(data)},{status:response.status});
    if (!data.id) return Response.json({error:'Gemini не вернул идентификатор исследования.'},{status:502});
    return Response.json({id:data.id,status:data.status || 'in_progress'});
  } catch(e) {return Response.json({error:'Не удалось запустить исследование: '+e.message},{status:500});}
}
export async function GET(request) {
  try {
    if (!process.env.MARS_RESEARCH_ACCESS_CODE || request.headers.get('x-mars-research-code') !== process.env.MARS_RESEARCH_ACCESS_CODE) return Response.json({error:'Необходим код доступа.'},{status:403});
    if (!process.env.GEMINI_API_KEY) return Response.json({error:'GEMINI_API_KEY не настроен.'},{status:503});
    const id = new URL(request.url).searchParams.get('id');
    if (!id || !/^v1_[A-Za-z0-9_-]{8,200}$/.test(id)) return Response.json({error:'Некорректный идентификатор исследования.'},{status:400});
    const response = await fetch(BASE+'/'+encodeURIComponent(id),{headers:{'x-goog-api-key':process.env.GEMINI_API_KEY,'Api-Revision':'2026-05-20'},cache:'no-store'});
    const data = await response.json();
    if (!response.ok) return Response.json({error:errorText(data)},{status:response.status});
    const output = data.output_text || (data.steps || []).filter(s=>s.type==='model_output').flatMap(s=>(s.content||[]).filter(c=>c.type==='text').map(c=>c.text)).join('\n\n');
    return Response.json({id:data.id,status:data.status || 'in_progress',report:output || '',error:data.error?.message || null});
  } catch(e) {return Response.json({error:'Не удалось проверить статус: '+e.message},{status:500});}
}