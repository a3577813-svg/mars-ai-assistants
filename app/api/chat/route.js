import OpenAI from 'openai';
import { roles } from '../../../lib/roles';
import { technologistInstructions } from '../../../lib/technologistInstructions';
import { marketerInstructions } from '../../../lib/marketerInstructions';
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

СХЕМЫ ВНУТРИ ДИАЛОГА:
Ты умеешь показывать схемы прямо внутри сообщения. Используй их только когда они действительно помогают увидеть УЖЕ СОБРАННЫЙ результат, а не вместо мыслительной работы ребёнка.
Особенно уместно: после завершённого смыслового этапа или по прямой просьбе ребёнка «покажи схемой», «собери в схему», «визуализируй».
Не вставляй схему в каждый ответ.
Не создавай схему до того, как ребёнок сформулировал и выбрал основные элементы.

Формат схемы должен быть СТРОГО таким:
:::scheme TYPE | Заголовок схемы
СТРОКА
СТРОКА
:::

Доступны три типа:
1) flow — цепочка/последовательность. Каждая строка: Название блока | Короткое содержание
2) cards — набор смысловых карточек. Каждая строка: Название карточки | Короткое содержание
3) proscons — две колонки «Сильные стороны / Риски». Каждая строка: plus | текст или risk | текст

Правила схем:
- Обычно 3–6 элементов.
- Каждый элемент очень короткий.
- Не объясняй ребёнку служебный синтаксис.
- После схемы можно задать один короткий следующий вопрос.
`;

    let roleInstructions = role.instructions;
    if (roleId === 'technologist') roleInstructions = `${technologistInstructions}\n${projectPassportInstructions}`;
    if (roleId === 'assistant') roleInstructions = marketerInstructions;

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
