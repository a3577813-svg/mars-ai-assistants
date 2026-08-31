'use client';

import { useEffect } from 'react';
import '../lib/roleCapabilities';

export default function LogoLoader() {
  useEffect(() => {
    let cancelled = false;

    async function applyLogo() {
      try {
        const response = await fetch('/mars-logo-120.b64.txt', { cache: 'no-store' });
        if (!response.ok) return;
        const base64 = (await response.text()).trim();
        if (!base64 || cancelled) return;

        document.querySelectorAll('.mars-logo').forEach((img) => {
          img.src = `data:image/png;base64,${base64}`;
        });
      } catch (_) {
        // Если файл временно недоступен, оставляем исходный src без падения страницы.
      }
    }

    applyLogo();
    return () => { cancelled = true; };
  }, []);

  return null;
}
