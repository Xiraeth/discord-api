const { INTENTS } = require("./constants");
const { updateIds } = require("./helpers");

const startHeartbeat = (ws, sequence, interval) => {
  const intervalId = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) return;
    const d = sequence || null;
    const payload = { op: 1, d };
    ws.send(JSON.stringify(payload));
    console.log("heartbeat sent");
  }, interval);

  return intervalId;
};

const sendIdentify = (ws, token) => {
  const payload = {
    op: 2,
    d: {
      token,
      intents:
        INTENTS.GUILDS |
        INTENTS.GUILD_MESSAGES |
        INTENTS.GUILD_MESSAGE_REACTIONS |
        INTENTS.DIRECT_MESSAGES |
        INTENTS.DIRECT_MESSAGE_REACTIONS,
      properties: {
        os: "macintosh",
        device: "pc",
      },
    },
  };

  ws.send(JSON.stringify(payload));
  updateIds();
};

const sendResume = (ws, token, session_id, seq) => {
  const payload = {
    op: 6,
    d: {
      token,
      session_id,
      seq: seq ?? 0,
    },
  };
  ws.send(JSON.stringify(payload));
  console.log("Sent Resume (op 6)");
};

module.exports = {
  sendIdentify,
  sendResume,
  startHeartbeat,
};
