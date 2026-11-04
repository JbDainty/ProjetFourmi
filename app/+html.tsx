import { ScrollViewStyleReset } from 'expo-router/html';
import { basePath } from '../src/config/paths';
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#365c49" />
        <meta
          name="description"
          content="Retrouvez les couleurs de vingt plantes européennes dans un jeu de tri de pigments et un herbier à restaurer."
        />
        <link rel="manifest" href={`${basePath}/manifest.json`} />
        <title>Herbier des couleurs</title>
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
