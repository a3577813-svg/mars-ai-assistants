import JSZip from 'jszip';
export const runtime='nodejs';
const esc=(v)=>String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const para=(text,style='')=>'<w:p>'+(style?'<w:pPr><w:pStyle w:val="'+style+'"/></w:pPr>':'')+'<w:r><w:t xml:space="preserve">'+esc(text)+'</w:t></w:r></w:p>';
const header=(text,level)=>para(text,level===1?'Heading1':'Heading2');
export async function POST(request){
 try{
  const {report='',form={}}=await request.json();
  if(typeof report!=='string'||!report.trim())return Response.json({error:'Отчёт ещё не получен'},{status:400});
  if(report.length>900000)return Response.json({error:'Отчёт слишком большой для экспорта'},{status:413});
  const blocks=[
    header('АНО ЦСКП «МАРС» · ОБНИНСК',2),
    header('НАУЧНО-АНАЛИТИЧЕСКИЙ ОТЧЁТ',1),
    para(form.topic||'Исследование'),
    para('Проект: '+(form.project||'Не указан')),
    para('Класс: '+(form.grade||'Не указан')+' · Роль: '+(form.role||'Не указана')),
    para('Сгенерировано Gemini Deep Research. Библиографические сведения и выводы требуют проверки педагогом.'),
    para('')
  ];
  for(const raw of report.split(/\r?\n/)){
    const line=raw.trim();
    const h=line.match(/^(#{1,4})\s+(.+)$/);
    if(h)blocks.push(header(h[2],h[1].length===1?1:2));
    else blocks.push(para(line));
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