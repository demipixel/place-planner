import axios from 'axios';
import { client as WebsocketClient, connection, Message } from 'websocket';

let accessToken: string | null = null;

export async function getCurrentImage(attempts = 0) {
  if (attempts >= 3) {
    throw new Error('Too many attempts');
  }

  const client = new WebsocketClient();

  if (!accessToken) {
    await refreshAccessToken();
  }

  return new Promise((res, rej) => {
    const offClientListeners = () => {
      client.removeListener('connectFailed', onConnFailed);
      client.removeListener('connect', onConn);
    };

    client.connect(
      'wss://gql-realtime-2.reddit.com/query',
      undefined,
      'https://reddit.com',
    );

    const onConnFailed = function (error: any) {
      console.log('Connect Error: ' + error.toString());
      rej(error);
      offClientListeners();
      client.abort();
    };

    const onConn = (conn: connection) => {
      const offConnListeners = () => {
        conn.removeListener('message', onMessage);
      };

      let complete = false;
      setTimeout(() => {
        if (!complete) {
          rej('Timeout');
          offClientListeners();
          offConnListeners();
          client.abort();
        }
      }, 5000);

      const onMessage = (event: Message) => {
        if (event.type !== 'utf8') {
          return;
        }
        const parsed = JSON.parse(event.utf8Data);

        if (
          parsed.type === 'data' &&
          parsed.payload.data.subscribe.data.__typename ===
            'FullFrameMessageData'
        ) {
          const imageUrl = parsed.payload.data.subscribe.data.name;
          offClientListeners();
          offConnListeners();
          client.abort();
          axios
            .get(imageUrl, {
              responseType: 'arraybuffer',
            })
            .then((response) => {
              complete = true;
              res(response.data);
            })
            .catch(rej);
        } else if (parsed.type === 'connection_error') {
          refreshAccessToken()
            .then(async () => {
              try {
                res(await getCurrentImage(attempts + 1));
              } catch (e) {
                rej(e);
              }
            })
            .catch(console.error);
        }
      };
      conn.on('message', onMessage);

      conn.send(
        JSON.stringify({
          type: 'connection_init',
          payload: { Authorization: 'Bearer ' + accessToken },
        }),
      );

      conn.send(
        JSON.stringify({
          id: '1',
          type: 'start',
          payload: {
            variables: {
              input: {
                channel: { teamOwner: 'AFD2022', category: 'CANVAS', tag: '0' },
              },
            },
            extensions: {},
            operationName: 'replace',
            query:
              'subscription replace($input: SubscribeInput!) {\n  subscribe(input: $input) {\n    id\n    ... on BasicMessage {\n      data {\n        __typename\n        ... on FullFrameMessageData {\n          __typename\n          name\n          timestamp\n        }\n        ... on DiffFrameMessageData {\n          __typename\n          name\n          currentTimestamp\n          previousTimestamp\n        }\n      }\n      __typename\n    }\n    __typename\n  }\n}\n',
          },
        }),
      );
    };

    client.on('connectFailed', onConnFailed);

    client.on('connect', onConn);
  });
}

async function refreshAccessToken() {
  accessToken = await axios
    .get('https://reddit.com/r/place')
    .then((resp) => resp.data)
    .then((text) => {
      const match = text.match(/"accessToken":"(.*?)"/);
      return match?.[1] || null;
    });
}
