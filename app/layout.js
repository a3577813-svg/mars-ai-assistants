import './styles.css';
import './logo-fix.css';
import './logo-icon-fix.css';
import LogoLoader from './LogoLoader';

export const metadata = {
  title: 'Проектные ассистенты',
  description: 'Лидер, Технолог, Ассистент и Аналитик для проектной деятельности'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <LogoLoader />
        {children}
      </body>
    </html>
  );
}
