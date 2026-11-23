import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
export const runtime='nodejs';
// Remove characters that XML 1.0 (and Microsoft Word) cannot represent.
const safe = (value) => String(value ?? '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g, '');
const asRuns = (line) => [new TextRun({text:safe(line)})];
export async function POST(request){
 try{
  const {report='',form={}}=await request.json();
  if(typeof report!=='string'||!report.trim())return Response.json({error:'Отчёт ещё не получен'},{status:400});
  if(report.length>900000)return Response.json({error:'Отчёт слишком большой для экспорта'},{status:413});
  const children=[
   new Paragraph({children:[new TextRun({text:'АНО ЦСКП «МАРС» · ОБНИНСК',bold:true,color:'4B20C8'})],alignment:AlignmentType.CENTER,spacing:{after:250}}),
   new Paragraph({text:'НАУЧНО-АНАЛИТИЧЕСКИЙ ОТЧЁТ',heading:HeadingLevel.TITLE,alignment:AlignmentType.CENTER,spacing:{after:300}}),
   new Paragraph({text:safe(form.topic||'Исследование').slice(0,500),alignment:AlignmentType.CENTER,spacing:{after:250}}),
   new Paragraph({text:'Проект: '+safe(form.project||'Не указан').slice(0,500),spacing:{after:100}}),
   new Paragraph({text:'Класс: '+safe(form.grade||'Не указан').slice(0,100)+' · Роль: '+safe(form.role||'Не указана').slice(0,100),spacing:{after:250}}),
   new Paragraph({children:[new TextRun({text:'Сгенерировано Gemini Deep Research. Библиографические сведения и выводы требуют проверки педагогом.',italics:true})],spacing:{after:350}})
  ];
  for(const raw of report.split(/\r?\n/)){
   const line=safe(raw).trim();
   if(!line){children.push(new Paragraph({text:'',spacing:{after:80}}));continue;}
   const h=line.match(/^(#{1,4})\s+(.+)$/);
   if(h){children.push(new Paragraph({text:h[2],heading:h[1].length===1?HeadingLevel.HEADING_1:HeadingLevel.HEADING_2,spacing:{before:240,after:100}}));continue;}
   const bullet=line.match(/^[-*•]\s+(.+)$/);
   const numbered=line.match(/^\d+[.)]\s+(.+)$/);
   const body=bullet?bullet[1]:numbered?line:line;
   children.push(new Paragraph({children:asRuns(body),bullet:bullet?{indent:400}:undefined,spacing:{after:110}}));
  }
  const doc=new Document({creator:'АНО ЦСКП МАРС',title:'Научно-аналитический отчёт МАРС',sections:[{children}]});
  const bytes=await Packer.toBuffer(doc);
  return new Response(bytes,{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition':'attachment; filename="MARS_Gemini_research.docx"','Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Не удалось сформировать Word-отчёт'},{status:500});}
}