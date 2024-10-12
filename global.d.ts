import 'typed-htmx';

declare module 'hono/jsx' {
  namespace JSX {
    interface HTMLAttributes extends HtmxAttributes {
      // Dumb prop so that TS doesn't get mad
      'data-test'?: string;
    }
  }
}
