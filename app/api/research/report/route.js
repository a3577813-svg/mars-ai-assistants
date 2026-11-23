import JSZip from 'jszip';
export const runtime='nodejs';
const esc=(v)=>String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';

const plain=(s)=>String(s??'').replace(/<br\s*\/?>/gi,'; ').replace(/\*\*(.*?)\*\*/g,'$1').replace(/(?<!\*)\*([^*]+)\*(?!\*)/g,'$1');
let linkId=0;const links=[];
function hyperlink(label,url){
 const id='rIdLink'+(++linkId);
 links.push({id,url:url.replace(/&amp;/g,'&')});
 return '<w:hyperlink r:id="'+id+'" w:history="1"><w:r><w:rPr><w:color w:val="2456A6"/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">'+esc(label)+'</w:t></w:r></w:hyperlink>';
}
const footnoteRefs=new Set();
function runs(text){
 const pattern=/(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|https?:\/\/[^\s<>]+|\[cite:\s*[\d,\s]+\]|\*\*[^*]+\*\*)/gi;
 const out=[];let pos=0;const value=String(text??'').replace(/<br\s*\/?>/gi,'; ');
 for(const m of value.matchAll(pattern)){
  if(m.index>pos)out.push('<w:r><w:t xml:space="preserve">'+esc(plain(value.slice(pos,m.index)))+'</w:t></w:r>');
  const v=m[0];
  if(m[2])out.push(hyperlink(m[2],m[3]));
  else if(/^https?:\/\//i.test(v))out.push(hyperlink(v,v.replace(/[.,;]+$/,'')));
  else if(v.startsWith('**'))out.push('<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">'+esc(v.slice(2,-2))+'</w:t></w:r>');
  else if(/^\[cite:/i.test(v)){for(const n of (v.match(/\d+/g)||[])){const id=Number(n);if(id>0&&id<=200){footnoteRefs.add(id);out.push('<w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:footnoteReference w:id="'+id+'"/></w:r>');}}}
  pos=m.index+v.length;
 }
 if(pos<value.length)out.push('<w:r><w:t xml:space="preserve">'+esc(plain(value.slice(pos)))+'</w:t></w:r>');
 return out.join('')||'<w:r><w:t> </w:t></w:r>';
}
const para=(text,style='',shaded=false)=>'<w:p>'+(style||shaded?'<w:pPr>'+(style?'<w:pStyle w:val="'+style+'"/>':'')+(shaded?'<w:shd w:val="clear" w:fill="F0EBFC"/>':'')+'</w:pPr>':'')+runs(text)+'</w:p>';
const header=(text,level)=>para('**'+plain(text)+'**',level===1?'Heading1':'Heading2');
const apparatusKeys=[['relevance','Актуальность'],['problem','Проблема исследования'],['object','Объект исследования'],['subject','Предмет исследования'],['goal','Цель исследования'],['tasks','Задачи исследования'],['methods','Методы исследования'],['hypothesis','Гипотеза']];
function table(rows){
 const count=Math.max(1,...rows.map(r=>r.length));
 const width=Math.floor(9638/count);
 const cells=rows.map((row,i)=>'<w:tr>'+Array.from({length:count},(_,j)=>{
  const value=row[j]||'';
  return '<w:tc><w:tcPr><w:tcW w:w="'+width+'" w:type="dxa"/><w:tcBorders><w:bottom w:val="single" w:sz="4" w:color="D8CFE9"/><w:right w:val="single" w:sz="4" w:color="D8CFE9"/></w:tcBorders>'+(i===0?'<w:shd w:fill="E9E1FB"/>':'')+'</w:tcPr>'+para(value)+'</w:tc>';
 }).join('')+'</w:tr>').join('');
 return '<w:tbl><w:tblPr><w:tblW w:w="9638" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D8CFE9"/><w:left w:val="single" w:sz="4" w:color="D8CFE9"/></w:tblBorders></w:tblPr><w:tblGrid>'+Array.from({length:count},()=>'<w:gridCol w:w="'+width+'"/>').join('')+'</w:tblGrid>'+cells+'</w:tbl>';
}
function isTableRow(line){return /^\|.+\|$/.test(line);}
function isSeparator(line){return /^\|[\s:|\-]+\|$/.test(line);}
function parseReport(report){
 const lines=report.split(/\r?\n/);const body=[];const bibliography=[];const introduction=[];const overview=[];
 let section='body';let title='';
 const bibHeader=/^(?:Sources|References|Список (?:использованной )?литературы(?: и источников)?|Библиография|Источники)(?:\s*:)?$/i;
 for(let i=0;i<lines.length;i++){
  const line=lines[i].trim();const normalized=plain(line.replace(/^#{1,5}\s*/,'' )).replace(/:$/,'').trim();
  if(bibHeader.test(normalized)){section='bibliography';continue;}
  if(section==='bibliography'){if(line)bibliography.push(line);continue;}
  if(/^введение$/i.test(normalized)){section='introduction';continue;}
  if(/^(?:обзор литературы|анализ литературы)(?:\s*:.*)?$/i.test(normalized)){section='overview';continue;}
  const h=line.match(/^(#{1,5})\s+(.+)$/);
  if(h||(/^(?:исследовательский аппарат|аннотация|методология|реестр источников|сравнительный анализ|практические выводы|ограничения)/i.test(normalized)&&normalized.length<125)){
   section='body';title=normalized;
   body.push(header(title,h&&h[1].length>1?2:1));continue;
  }
  const target=section==='introduction'?introduction:section==='overview'?overview:body;
  if(isTableRow(line)){
   const rows=[];while(i<lines.length&&isTableRow(lines[i].trim())){const row=lines[i].trim();if(!isSeparator(row))rows.push(row.slice(1,-1).split('|').map(v=>v.trim()));i++;}
   i--;if(rows.length>=2&&rows.length<=80&&Math.max(...rows.map(r=>r.length))<=8)target.push(table(rows));else rows.forEach(row=>target.push(para(row.join(' | '))));continue;
  }
  if(line)target.push(para(line));
 }
 return {body,introduction,overview,bibliography};
}
function bibliographyItems(lines){
 const entries=[];let current='';
 for(const line of lines){
  if(/^\d+[.)]\s/.test(line)||/^[-*]\s/.test(line)){if(current)entries.push(current);current=line.replace(/^\d+[.)]\s|^[-*]\s/,'');}
  else current+=(current?' ':'')+line;
 }
 if(current)entries.push(current);
 return entries;
}
function bibliographyLine(entry,index){
 const md=entry.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
 const urls=[...entry.matchAll(/https?:\/\/[^\s)]+/g)].map(m=>m[0]);
 const url=md?.[2]||urls[0];
 let name=md?.[1]||entry.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/https?:\/\/[^\s)]+/g,'').replace(/^\s*\[?cite:\s*[\d,\s]+\]?\s*/i,'').trim();
 if(!name||/^(?:cyberleninka\.ru|www\.)/i.test(name))name='Источник '+index+' (название публикации не указано)';
 return '<w:p><w:r><w:t xml:space="preserve">'+esc(index+'. ')+'</w:t></w:r>'+(url?hyperlink(name,url):runs(name))+'</w:p>';
}
export async function POST(request){
 try{
  const {report='',form={}}=await request.json();
  if(typeof report!=='string'||!report.trim())return Response.json({error:'Отчёт ещё не получен'},{status:400});
  if(report.length>900000)return Response.json({error:'Отчёт слишком большой для экспорта'},{status:413});
  linkId=0;links.length=0;footnoteRefs.clear();
  const parsed=parseReport(report);
  const blocks=[
    header('АНО ЦСКП «МАРС» · ОБНИНСК',2),
    header('НАУЧНО-АНАЛИТИЧЕСКИЙ ОТЧЁТ',1),
    para(form.topic||'Исследование'),
    para('Проект: '+(form.project||'Не указан')),
    para('Класс: '+(form.grade||'Не указан')+' · Роль: '+(form.role||'Не указана')),
    para('Материал для самостоятельной работы ученика. Научные утверждения и источники требуют проверки.'),
    header('ВВОДНАЯ ЧАСТЬ',1)
  ];
  // Introductory report abstract is kept before the formal introduction.
  const abstractEnd=parsed.body.findIndex(x=>/Аннотация|Исследовательский аппарат/.test(x));
  if(abstractEnd>=0)blocks.push(...parsed.body.splice(0,abstractEnd+1));
  blocks.push(header('ВВЕДЕНИЕ',1));
  const known=new Map(apparatusKeys.filter(([key])=>String(form[key]||'').trim()).map(([key,label])=>[label,form[key]]));
  for(const [key,label] of apparatusKeys){
    if(known.has(label))blocks.push(para('**'+label+'.** '+known.get(label),'',true));
    else if(key==='relevance'||key==='hypothesis')blocks.push(para('**'+label+'.** Не сформулировано в исходных материалах.','',true));
  }
  blocks.push(...parsed.introduction);
  blocks.push(header('СОДЕРЖАНИЕ ИССЛЕДОВАНИЯ',1),...parsed.body);
  blocks.push(header('АНАЛИЗ ЛИТЕРАТУРЫ',1),...parsed.overview);
  const entries=bibliographyItems(parsed.bibliography);
  blocks.push(header('СПИСОК ЛИТЕРАТУРЫ И ИСТОЧНИКОВ',1));
  if(entries.length)entries.forEach((entry,i)=>blocks.push(bibliographyLine(entry,i+1)));
  else blocks.push(para('Библиографический список не представлен в исходном отчёте; необходимо дополнить проверенными публикациями.'));
  const document='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<w:document xmlns:w="'+W+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>'+blocks.join('')+
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>';
  const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<w:styles xmlns:w="'+W+'">'+
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial"/><w:sz w:val="22"/></w:rPr></w:style>'+
    '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="300" w:after="160"/></w:pPr><w:rPr><w:b/><w:color w:val="4B20C8"/><w:sz w:val="32"/></w:rPr></w:style>'+
    '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style></w:styles>';
  const types='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
    '<Default Extension="xml" ContentType="application/xml"/>'+
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'+
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'+
    '</Types>';
  const rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
  const wordRels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+links.map(l=>'<Relationship Id="'+l.id+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="'+esc(l.url)+'" TargetMode="External"/>').join('')+'</Relationships>';
  const zip=new JSZip();
  zip.file('[Content_Types].xml',types);
  zip.file('_rels/.rels',rels);
  zip.file('word/document.xml',document);
  zip.file('word/styles.xml',styles);
  zip.file('word/_rels/document.xml.rels',wordRels);
  const bytes=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
  return new Response(bytes,{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition':'attachment; filename="MARS_Gemini_research.docx"','Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Не удалось сформировать Word-отчёт'},{status:500});}
}