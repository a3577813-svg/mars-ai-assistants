import OpenAI from 'openai';
export const runtime = 'nodejs';
const fields = ['project','grade','role','topic','problem','object','subject','goal','tasks','methods'];
const prompt = `Ты — AI-тьютор исследования МАРС для школьников 5–11 классов. Веди пошаговый диалог на русском.
ПЕДАГОГИКА: ученик — автор решений. В каждом сообщении ОДИН основной вопрос. Сначала выясни класс, суть проекта, реальный продукт, стадию и ЛИЧНЫЙ вклад и роль. Не спрашивай заново известное. Затем найди исследовательский пробел: что команде неизвестно и какое решение требует обоснования. Предложи 2–3 ПОСИЛЬНЫЕ темы, каждая связана с ролью (лидер — проблема/ценность/стратегия; технолог — способы и механики; аналитик — сравнение опыта/данных; маркетолог — аудитория/восприятие/коммуникации). Объясни различия; ребёнок выбирает.
Затем ПО ОДНОМУ элементу согласуй проблему, объект, предмет, цель, задачи, методы; гипотезу только если уместна. После каждого ответа дай содержательную обратную связь, а не только похвалу. Не выдумывай проектные результаты. Проверяй соответствие аппарата возрасту и проекту. Не называй непроверенные статьи реальными. Когда аппарат согласован, предложи поиск источников. После поиска помоги разобрать реальные статьи и сформулировать собственные предварительные выводы.
СТРОГО: не запускай Gemini и не обещай, что ученик может его запустить. Не составляй готовый отчёт вместо ребёнка.
Когда ребёнок явно утвердил весь аппарат, в конце сообщения выведи отдельный машинно-читаемый блок (не используй markdown fences), чтобы сайт сформировал паспорт:
:::passport
{"project":"...","grade":"...","role":"...","topic":"...","problem":"...","object":"...","subject":"...","goal":"...","tasks":"...","methods":"..."}
:::endpassport
Выводи его ТОЛЬКО после согласования, все строки заполняй из подтверждённых ответов. В иных случаях блок запрещён. Продолжай помогать после паспорта.`;
export async function POST(request){
 try {
  if(!process.env.OPENAI_API_KEY)return Response.json({error:'OPENAI_API_KEY не настроен'},{status:503});
  const {messages=[],context={}}=await request.json();
  if(!Array.isArray(messages)||!messages.length)return Response.json({error:'Нет сообщения'},{status:400});
  const clean=messages.slice(-24).filter(m=>['user','assistant'].includes(m.role)&&typeof m.content==='string').map(m=>({role:m.role,content:m.content.slice(0,6000)}));
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  const res=await client.responses.create({model:process.env.OPENAI_MODEL||'gpt-5-mini',instructions:prompt+'\nИзвестный контекст: '+JSON.stringify(Object.fromEntries(fields.map(k=>[k,String(context[k]||'').slice(0,500)]))),input:clean});
  const raw=res.output_text||'Не удалось получить ответ';
  const match=raw.match(/:::passport\s*([\s\S]*?)\s*:::endpassport/);
  let passport=null;
  if(match){try{const p=JSON.parse(match[1]);if(fields.every(k=>typeof p[k]==='string')&&p.topic&&p.goal&&p.project)passport=Object.fromEntries(fields.map(k=>[k,p[k]]));}catch{}}
  return Response.json({text:raw.replace(/:::passport[\s\S]*?:::endpassport/g,'').trim(),passport});
 }catch(e){console.error(e);return Response.json({error:'Ошибка исследовательского тьютора'},{status:500});}
}