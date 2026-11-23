import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink, Footer } from 'docx';
export const runtime='nodejs';
const asRuns=(line)=>{
 const pieces=line.split(/(https?:\/\/[^\s<>]+)/g);
 return pieces.filter(Boolean).map(part=>part.startsWith('http')?new ExternalHyperlink({link:part.replace(/[),.;]+$/,''),children:[new TextRun({text:part,color:'2456A6',underline:{color:'2456A6'}})]}):new TextRun({text:part}));
};
export async function POST(request){
 try{
  const {report='',form={}}=await request.json();
  if(typeof report!=='string'||!report.trim())return Response.json({error:'Отчёт ещё не получен'},{status:400});
  if(report.length>900000)return Response.json({error:'Отчёт слишком большой для экспорта'},{status:413});
  const children=[
   new Paragraph({text:'АНО ЦСКП «МАРС» · ОБНИНСК',alignment:AlignmentType.CENTER,spacing:{after:250},children:[new TextRun({text:'',bold:true})]}),
   new Paragraph({text:'НАУЧНО-АНАЛИТИЧЕСКИЙ ОТЧЁТ',heading:HeadingLevel.TITLE,alignment:AlignmentType.CENTER,spacing:{after:300}}),
   new Paragraph({text:String(form.topic||'Исследование').slice(0,500),alignment:AlignmentType.CENTER,spacing:{after:250}}),
   new Paragraph({text:'Проект: '+String(form.project||'Не указан').slice(0,500),spacing:{after:100}}),
   new Paragraph({text:'Класс: '+String(form.grade||'Не указан').slice(0,100)+' · Роль: '+String(form.role||'Не указана').slice(0,100),spacing:{after:250}}),
   new Paragraph({text:'Сгенерировано Gemini Deep Research. Библиографические сведения и выводы требуют проверки педагогом.',spacing:{after:350},children:[new TextRun({text:'',italics:true})]})
  ];
  for(const raw of report.split(/\r?\n/)){
   const line=raw.trim();
   if(!line){children.push(new Paragraph({text:'',spacing:{after:80}}));continue;}
   const h=line.match(/^(#{1,4})\s+(.+)$/);
   if(h){children.push(new Paragraph({text:h[2],heading:h[1].length===1?HeadingLevel.HEADING_1:HeadingLevel.HEADING_2,spacing:{before:240,after:100}}));continue;}
   const bullet=line.match(/^[-*•]\s+(.+)$/);
   const numbered=line.match(/^\d+[.)]\s+(.+)$/);
   const body=bullet?bullet[1]:numbered?line:line;
   children.push(new Paragraph({children:asRuns(body),bullet:bullet?{indent:400}:undefined,spacing:{after:110}}));
  }
  const doc=new Document({creator:'АНО ЦСКП МАРС',title:'Научно-аналитический отчёт МАРС',styles:{default:{document:{run:{font:'Arial',size:22},paragraph:{spacing:{line:300}}}}},sections:[{properties:{page:{margin:{top:1000,bottom:1000,left:1100,right:1100}}},children,footers:{default:new Footer({children:[new Paragraph({text:'АНО ЦСКП «МАРС», Обнинск',alignment:AlignmentType.CENTER})]})}}]});
  const bytes=await Packer.toBuffer(doc);
  return new Response(bytes,{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition':'attachment; filename="MARS_Gemini_research.docx"','Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Не удалось сформировать Word-отчёт'},{status:500});}
}