import OpenAI from 'openai';
export const runtime='nodejs';
export async function POST(request){
 try{
  if(!process.env.OPENAI_API_KEY)return Response.json({error:'OPENAI_API_KEY не настроен'},{status:503});
  const {topic='',goal='',tasks=''}=await request.json();
  if(!topic.trim())return Response.json({error:'Сначала согласуйте тему исследования'},{status:400});
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  const response=await client.responses.create({
   model:process.env.OPENAI_SEARCH_MODEL||'gpt-4.1-mini',
   tools:[{type:'web_search'}],
   instructions:'Ты — научный библиограф МАРС. Ищи прежде всего НАСТОЯЩИЕ статьи cyberleninka.ru, используя веб-поиск. Никаких вымышленных авторов, заголовков, годов, DOI, цитат и ссылок. Возвращай только статьи с конкретным URL, реально найденным поиском. Для каждой: название, авторы и год только если подтверждены; релевантность задачам; 1 вопрос для школьника. Если текст статьи не открыт, явно пиши «полный текст не проверен». Отделяй найденные источники от рекомендаций для дальнейшего поиска. Ссылки оставляй в явном виде, не обещай проверку, которой не было.',
   input:'Тема: '+topic.slice(0,500)+'\nЦель: '+goal.slice(0,500)+'\nЗадачи: '+tasks.slice(0,1000)+'\nНайди 5–8 релевантных статей на cyberleninka.ru, если столько реально есть. Дай прямые URL и поясни, чем полезны проекту.',
  });
  return Response.json({text:response.output_text||'Поиск не вернул результатов. Попробуйте уточнить тему.'});
 }catch(e){console.error(e);return Response.json({error:'Поиск не удался. Проверьте доступность веб-поиска OpenAI API.'},{status:502});}
}