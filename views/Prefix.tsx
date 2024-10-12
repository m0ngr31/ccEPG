import {FC} from 'hono/jsx';

import { CC_PREFIX } from '../services/misc-db';

export interface IPrefixProps {
  currentPrefix: string;
  invalid?: boolean;
}

export const Prefix: FC<IPrefixProps> = ({currentPrefix = CC_PREFIX, invalid = false}) => {
  return (
    <section hx-target="this" hx-swap="outerHTML">
      <h3>
        <span data-tooltip="chrome-capture-for-channels server URI" data-placement="bottom">
          CC4C Endpoint
        </span>
      </h3>
      <form
        hx-put="/update-prefix"
        hx-trigger="submit"
        hx-on="htmx:beforeRequest: this.querySelector('button').setAttribute('aria-busy', 'true'); this.querySelector('button').setAttribute('aria-label', 'Loading…'); this.querySelector('input').disabled = true"
      >
        <fieldset role="group">
          <input
            type="text"
            name="cc_prefix"
            placeholder={CC_PREFIX}
            value={currentPrefix}
            {...(invalid && {
              'aria-describedby': 'invalid-helper',
              'aria-invalid': 'true',
            })}
          />
          <button type="submit" id="update-button">
            Update
          </button>
        </fieldset>
        {invalid && <small id="invalid-helper">Please provide a valid URI</small>}
      </form>
      <hr />
    </section>
  );
};
