import {FC} from 'hono/jsx';

import {IChannel} from '../services/shared-interfaces';

export interface IProviderProps {
  name: string;
  channels: IChannel[];
  enabled: boolean;
}

export const Provider: FC<IProviderProps> = ({name, channels, enabled}) => {
  return (
    <div hx-target="this" hx-swap="outerHTML">
      <section class="overflow-auto provider-section">
        <div class="grid-container">
          <h4>{name}</h4>
          <fieldset>
            <label>
              <input
                hx-put={`/provider/toggle/${name}`}
                hx-trigger="change"
                name="provider-enabled"
                type="checkbox"
                role="switch"
                checked={enabled ? true : false}
              />
              Enabled
            </label>
          </fieldset>
        </div>
        {enabled && (
          <table class="striped">
            <thead>
              <tr>
                <th></th>
                <th scope="col">Name</th>
                <th scope="col">Link</th>
              </tr>
            </thead>
            <tbody>
              {channels.map(c => (
                <tr key={c.id}>
                  <td>
                    <input
                      hx-target="this"
                      hx-swap="outerHTML"
                      type="checkbox"
                      checked={c.enabled}
                      hx-put={`/channel/toggle/${c.id}`}
                      hx-trigger="change"
                      name="channel-enabled"
                    />
                  </td>
                  <td>{c.name}</td>
                  <td>
                    <a href={c.url} class="secondary" target="_blank">
                      {c.url}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <hr />
    </div>
  );
};
