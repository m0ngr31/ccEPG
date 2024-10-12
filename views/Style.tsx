import type {FC} from 'hono/jsx';

export const Style: FC = () => (
  <style>{`
    .provider-section {
      max-height: 30rem;
    }
    .grid-container {
      display: grid;
      grid-template-columns: 1fr auto;
      justify-items: stretch;
      align-items: stretch;
      padding-right: 1rem;
    }
  `}</style>
);
