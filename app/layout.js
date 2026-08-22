import './styles.css';

export const metadata = {
  title: 'Проектные ассистенты',
  description: 'Лидер, Технолог, Ассистент и Аналитик для проектной деятельности'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
