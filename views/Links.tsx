import type {FC} from 'hono/jsx';

export interface ILinksProps {
  baseUrl: string;
}

export const Links: FC<ILinksProps> = ({baseUrl}) => {
  const xmltvUrl = `${baseUrl}/xmltv.xml`;
  const channelsUrl = `${baseUrl}/channels.m3u`;

  return (
    <section>
      <h3>
        <span data-tooltip="Import these into ChannelsDVR" data-placement="bottom">
          Links
        </span>
      </h3>
      <table class="striped">
        <thead>
          <tr>
            <th scope="col">Description</th>
            <th scope="col">Link</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Insert into Source section</td>
            <td>
              <a href={xmltvUrl} class="secondary" target="_blank">
                {xmltvUrl}
              </a>
            </td>
          </tr>
          <tr>
            <td>Insert into XMLTV Guide Data section</td>
            <td>
              <a href={channelsUrl} class="secondary" target="_blank">
                {channelsUrl}
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
};
