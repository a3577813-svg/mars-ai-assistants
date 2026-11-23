import JSZip from 'jszip';
export const runtime='nodejs';
const esc=(v)=>String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';

const plain=(s)=>String(s??'').replace(/<br\s*\/?>/gi,'; ').replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'$1 ($2)').replace(/\*\*(.*?)\*\*/g,'$1').replace(/(?<!\*)\*([^*]+)\*(?!\*)/g,'$1');
const runs=(text)=>plain(text).split(/(\*\*[^*]+\*\*)/g).map(v=>'<w:r><w:t xml:space="preserve">'+esc(v)+'</w:t></w:r>').join('');
const para=(text,style='',shaded=false)=>'<w:p>'+(style||shaded?'<w:pPr>'+(style?'<w:pStyle w:val="'+style+'"/>':'')+(shaded?'<w:shd w:val="clear" w:fill="F0EBFC"/>':'')+'</w:pPr>':'')+runs(text)+'</w:p>';
const header=(text,level)=>para(text,level===1?'Heading1':'Heading2');
const apparatusKeys=[['problem','Проблема исследования'],['object','Объект исследования'],['subject','Предмет исследования'],['goal','Цель исследования'],['tasks','Задачи исследования'],['methods','Методы исследования']];
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
 const lines=report.split(/\r?\n/);
 const body=[];const bibliography=[];let inSources=false;let inApparatus=false;
 for(let i=0;i<lines.length;i++){
  const line=lines[i].trim();
  if(/^(?:#{1,4}\s*)?(?:\*\*)?(?:Sources|References|Список (?:использованной )?литературы|Библиография|Источники)(?:\*\*)?:?\s*$/i.test(line)){inSources=true;continue;}
  if(inSources){if(line)bibliography.push(line);continue;}
  const h=line.match(/^(#{1,4})\s+(.+)$/);
  if(h){const title=plain(h[2]);inApparatus=/исследовательск(?:ий|ого) аппарат/i.test(title);body.push(header(title,h[1].length===1?1:2));continue;}
  if(/^(?:исследовательский аппарат|реестр источников|обзор литературы|методология|аннотация|практические выводы|ограничения|сравнительный анализ)/i.test(line)&&line.length<130){inApparatus=/исследовательский аппарат/i.test(line);body.push(header(line,1));continue;}
  if(isTableRow(line)){
   const rows=[];while(i<lines.length&&isTableRow(lines[i].trim())){const row=lines[i].trim();if(!isSeparator(row))rows.push(row.slice(1,-1).split('|').map(v=>v.trim()));i++;}
   i--;if(rows.length>=2&&rows.length<=80&&Math.max(...rows.map(r=>r.length))<=8)body.push(table(rows));else rows.forEach(row=>body.push(para(row.join(' | '))));
   continue;
  }
  if(!line){body.push(para(''));continue;}
  body.push(para(line,'',inApparatus));
 }
 return {body,bibliography};
}
export async function POST(request){
 try{
  const {report='',form={}}=await request.json();
  if(typeof report!=='string'||!report.trim())return Response.json({error:'Отчёт ещё не получен'},{status:400});
  if(report.length>900000)return Response.json({error:'Отчёт слишком большой для экспорта'},{status:413});
  const parsed=parseReport(report);
  const blocks=[
    header('АНО ЦСКП «МАРС» · ОБНИНСК',2),
    header('НАУЧНО-АНАЛИТИЧЕСКИЙ ОТЧЁТ',1),
    para(form.topic||'Исследование'),
    para('Проект: '+(form.project||'Не указан')),
    para('Класс: '+(form.grade||'Не указан')+' · Роль: '+(form.role||'Не указана')),
    para('Сгенерировано Gemini Deep Research. Библиографические сведения и выводы требуют проверки педагогом.'),
    para('')
  ];
  if(apparatusKeys.some(([key])=>String(form[key]||'').trim())){
    blocks.push(header('ИССЛЕДОВАТЕЛЬСКИЙ АППАРАТ · СОГЛАСОВАННОЕ ЗАДАНИЕ',1));
    for(const [key,label] of apparatusKeys)if(form[key])blocks.push(para(label+': '+form[key],'',true));
    blocks.push(para(''));
  }
  blocks.push(...parsed.body);
  if(parsed.bibliography.length){
    blocks.push(header('СПИСОК ЛИТЕРАТУРЫ И ИСТОЧНИКОВ',1));
    for(const line of parsed.bibliography)blocks.push(para(line));
  }
  const document='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<w:document xmlns:w="'+W+'"><w:body>'+blocks.join('')+
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
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
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