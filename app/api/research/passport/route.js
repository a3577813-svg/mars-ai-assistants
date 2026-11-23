import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Footer, Header, ExternalHyperlink } from 'docx';
export const runtime='nodejs';
const items=[['project','Название проекта'],['grade','Класс'],['role','Роль в проекте'],['topic','Тема исследования'],['problem','Исследовательская проблема'],['object','Объект исследования'],['subject','Предмет исследования'],['goal','Цель исследования'],['tasks','Задачи исследования'],['methods','Методы исследования']];
const split=(s)=>String(s||'').split(/\r?\n/).filter(Boolean);
export async function POST(request){
 try{
  const {form={},sources=''}=await request.json();
  if(!form.topic||!form.project)return Response.json({error:'Сначала согласуйте исследовательский паспорт'},{status:400});
  const children=[
   new Paragraph({text:'АНО ЦСКП «МАРС» · ОБНИНСК',alignment:AlignmentType.CENTER,spacing:{after:300},run:{bold:true,color:'4B20C8',size:22}}),
   new Paragraph({text:'ИССЛЕДОВАТЕЛЬСКИЙ ПАСПОРТ',heading:HeadingLevel.TITLE,alignment:AlignmentType.CENTER,spacing:{after:300}}),
   new Paragraph({text:'Рабочий документ ученика · для согласования с педагогом',alignment:AlignmentType.CENTER,spacing:{after:400},run:{italics:true,color:'666666'}})
  ];
  for(const [key,title] of items){
   children.push(new Paragraph({text:title,heading:HeadingLevel.HEADING_2,spacing:{before:180,after:90}}));
   for(const line of split(form[key]||'Не заполнено'))children.push(new Paragraph({text:line,spacing:{after:100}}));
  }
  children.push(new Paragraph({text:'Подборка научных публикаций',heading:HeadingLevel.HEADING_1,spacing:{before:320,after:150}}));
  children.push(new Paragraph({text:'Ссылки и библиографические сведения необходимо сверить с оригинальными публикациями.',spacing:{after:160},run:{italics:true}}));
  if(sources.trim()){
   for(const line of split(sources).slice(0,160)){
    const parts=line.split(/(https?:\/\/[^\s<>]+)/g);
    const runs=parts.map(part=>part.startsWith('http')?new ExternalHyperlink({link:part.replace(/[),.;]+$/,''),children:[new TextRun({text:part,color:'2456A6',underline:{color:'2456A6'}})]}):new TextRun({text:part}));
    children.push(new Paragraph({children:runs,spacing:{after:100}}));
   }
  }else children.push(new Paragraph({text:'Подборка ещё не выполнена.'}));
  children.push(new Paragraph({text:'Предварительные выводы ученика',heading:HeadingLevel.HEADING_1,spacing:{before:320,after:150}}));
  children.push(new Paragraph({text:'Заполняется учеником после анализа источников.'}));
  children.push(new Paragraph({text:'Замечания и согласование педагога',heading:HeadingLevel.HEADING_1,spacing:{before:320,after:150}}));
  children.push(new Paragraph({text:'__________________________________________________________________'}));
  const doc=new Document({creator:'АНО ЦСКП МАРС',title:'Исследовательский паспорт МАРС',styles:{default:{document:{run:{font:'Arial',size:22},paragraph:{spacing:{line:300}}}}},sections:[{properties:{page:{margin:{top:1000,bottom:1000,left:1100,right:1100}}},children,footers:{default:new Footer({children:[new Paragraph({text:'АНО ЦСКП «МАРС», Обнинск',alignment:AlignmentType.CENTER})]})}}]});
  const buffer=await Packer.toBuffer(doc);
  return new Response(buffer,{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition':"attachment; filename=\"MARS_research_passport.docx\"",'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Не удалось сформировать документ Word'},{status:500});}
}