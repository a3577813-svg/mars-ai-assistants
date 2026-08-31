import OpenAI from 'openai';
import { roles } from '../../../lib/roles';
import '../../../lib/roleCapabilities';
import { technologistInstructions } from '../../../lib/technologistInstructions';
import { marketerInstructions } from '../../../lib/marketerInstructions';
import { analystInstructions } from '../../../lib/analystInstructions';
import { projectPassportInstructions } from '../../../lib/projectPassportInstructions';

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

    // Keep enough recent context for a coherent tutoring dialogue without
    // resending the entire conversation on every turn.
    const cleanMessages = messages
      .slice(-16)
      .filter((m) => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));

    const projectContext = [
      name ? `Имя ученика: ${name}.` : '',
      project ? `Название проекта: ${project}.` : 'Название проекта пока не указано.'
    ].filter(Boolean).join('\n');

    const readabilityRules = `
ФОРМАТ ВЕБ-ЧАТА:
- Отвечай компактно: обычно 5–8 коротких строк или до 3 смысловых блоков; подробнее — только когда это необходимо по задаче.
- Один абзац — одна мысль. Не повторяй уже сказанное.
- Названия смысловых блоков выделяй Markdown-жирным.
- Для вариантов используй короткий список.
- Главный вопрос ребёнку ставь в конце как **Твой ход**.
- В пошаговой технологии работай с текущим шагом, не пересказывай весь метод.
- Для экспертного разбора удобно: **Сильное** → **Риск** → **Мой вариант** → **Твой ход**.

СХЕМЫ:
Используй только для уже собранного результата или по прямой просьбе ребёнка. Не вставляй схему в каждый ответ и не создавай её раньше, чем ребёнок сформулировал основные элементы.
Формат строго такой:
:::scheme TYPE | Заголовок схемы
СТРОКА
СТРОКА
:::
Типы: flow (Название блока | содержание), cards (Название карточки | содержание), proscons (plus | текст / risk | текст).
Обычно 3–6 коротких элементов. После схемы можно задать один следующий вопрос.
`;

    let roleInstructions = role.instructions;
    if (roleId === 'technologist') roleInstructions = `${technologistInstructions}\n${projectPassportInstructions}`;
    if (roleId === 'assistant') roleInstructions = marketerInstructions;
    if (roleId === 'analyst') roleInstructions = analystInstructions;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      instructions: `${roleInstructions}\n\n${readabilityRules}\nКОНТЕКСТ ТЕКУЩЕЙ СЕССИИ:\n${projectContext}`,
      input: cleanMessages
    });

    return Response.json({ text: response.output_text || 'Я не смог сформировать ответ. Попробуй ещё раз.' });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Ошибка обращения к OpenAI API.' }, { status: 500 });
  }
}