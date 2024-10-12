import _ from 'lodash';

let serverPort = _.toNumber(process.env.PORT);
if (_.isNaN(serverPort)) {
  serverPort = 8787;
}

export const SERVER_PORT = serverPort;
