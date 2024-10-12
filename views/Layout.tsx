import type {FC, ReactNode} from 'hono/jsx';

export interface ILayoutProps {
  children: ReactNode;
}

export const Layout: FC = ({children}: ILayoutProps) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="color-scheme" content="light dark" />
      <script src="//unpkg.com/htmx.org@1.9.3"></script>
      <script src="//unpkg.com/hyperscript.org@0.9.9"></script>
      <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
      <title>ccEPG</title>
    </head>
    <body>
      {children}
    </body>
  </html>
);
