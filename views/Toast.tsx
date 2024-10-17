import type {FC} from 'hono/jsx';

import {generateRandom} from '../services/shared-helpers';

export interface IToastProps {
  message: string;
  type: 'error' | 'success';
}

export const Toast: FC<IToastProps> = ({message, type}) => {
  const id = generateRandom(8, 'toast');

  return (
    <div
      class={`alert ${type === 'error' ? 'alert-danger' : 'alert-success'}`}
      role="alert"
      id={id}
      style={{
        left: '50%',
        position: 'fixed',
        top: '2rem',
        transform: 'translateX(-50%)',
        zIndex: '1000',
      }}
    >
      {message}
    </div>
  );
};
