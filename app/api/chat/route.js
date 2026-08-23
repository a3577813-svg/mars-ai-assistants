import OpenAI from 'openai';
import { roles } from '../../../lib/roles';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: 'На сервере не задан OPENAI_API_KEY.' }, { status: 500 });
    }

    const body = await request.json();
    const { roleId, messages = [], name = '', project = '' } = body;
    const role = roles[roleId];

    if (!role) return Response.json({ error: 'Неизвестная роль.' }, { status: 400 });
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Нет сообщения для отправки.' }, { status: 400 });
    }

    const cleanMessages = messages
      .slice(-30)
      .filter((m) => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content.slice(0, 12000) }));

    const projectContext = [
      name ? `Имя ученика: ${name}.` : '',
      project ? `Название проекта: ${project}.` : 'Название проекта пока не указано.'
    ].filter(Boolean).join('\n');

    const readabilityRules = `
ПРАВИЛА ФОРМАТА ОТВЕТА В ВЕБ-ЧАТЕ:
- Пиши коротко и визуально структурированно. Обычно один ответ — 5–8 коротких строк или до 3 небольших смысловых блоков. Длиннее только когда без этого нельзя или ребёнок просит подробности.
- Не пиши сплошную стену текста. Один абзац — одна мысль, обычно 1–2 предложения.
- Смысловые названия блоков выделяй Markdown-жирным: например **Что делаем**, **Почему этот метод**, **Моя рекомендация**, **Твой ход**, **Плюсы**, **Риски**.
- Для 2–3 вариантов используй короткий маркированный список. На один вариант — одна короткая фраза.
- Самый важный вопрос ребёнку ставь в конце отдельным блоком **Твой ход**.
- Не повторяй уже сказанное ради структуры и не создавай заголовок для каждого предложения.
- Если идёт пошаговая технология, в одном сообщении работай только с текущим шагом, а не пересказывай весь метод заново.
- Если нужно дать экспертный разбор ответа ребёнка, предпочтительный компактный формат: **Сильное** → **Риск** → **Мой вариант** → **Твой ход**.
`;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      instructions: `${role.instructions}\n\n${readabilityRules}\nКОНТЕКСТ ТЕКУЩЕЙ СЕССИИ:\n${projectContext}`,
      input: cleanMessages
    });

    return Response.json({ text: response.output_text || 'Я не смог сформировать ответ. Попробуй ещё раз.' });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Ошибка обращения к OpenAI API.' }, { status: 500 });
  }
}
