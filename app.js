const WebSocket = require("ws");
const { sendIdentify, sendResume, startHeartbeat } = require("./events");
const { upsertSession } = require("./helpers");
const { OPCODES } = require("./constants");
require("dotenv").config();

const token = process.env.BOT_TOKEN;

const discordApiUrl = "https://discord.com/api";
const queryParams = "?v=10&encoding=json";

const isDev = process.env.NODE_ENV === "dev";

let gatewayUrl = "";

let currentSocket;

let heartbeat;
let heartBeatIntervalMS = 0;
let resume_gateway_url;
let reconnect_attempts = 0;
let session_id;
let last_sequence;

const resetValues = () => {
  reconnect_attempts = 0;
  heartbeat = undefined;
  heartBeatIntervalMS = 0;
  resume_gateway_url = undefined;
  session_id = undefined;
  last_sequence = undefined;
  currentSocket = undefined;
  gatewayUrl = undefined;
};

const getGateway = async () => {
  const headers = new Headers({
    "User-Agent":
      "DiscordBot (https://github.com/discord/discord-api-docs, 1.0.0)",
  });
  const request = await fetch(`${discordApiUrl}/gateway`, {
    headers,
  });
  const response = await request.json();
  gatewayUrl = `${response.url}${queryParams}`;
  currentSocket = new WebSocket(gatewayUrl);
  connectToGateway(currentSocket);
};

const connectToGateway = (socket, isReconnecting = false) => {
  currentSocket = socket;

  socket.on("open", () => {
    console.log("Socket opened. Initializing connection ...");
  });

  socket.on("message", (e) => {
    const msg = JSON.parse(e.toString());
    const { op, t, s, d } = msg;

    if (s) {
      last_sequence = s;
    }

    // confirm that connection is established - start heartbeat interval
    switch (op) {
      // dispatch event - an event was dispatched
      // t = 'READY' means a ready event that is received after identifying
      case OPCODES.DISPATCH: {
        switch (t) {
          case "READY": {
            console.log(
              "Received READY. Logged in as:",
              d.user?.username ?? d.user,
            );
            ({ resume_gateway_url, session_id } = d);
            if (isDev) upsertSession(session_id);
            break;
          }
          default: {
            console.log("Event with type:", t);
            break;
          }
        }
        break;
      }

      // heartbeat request - respond immediately without waiting for the interval then resume
      case OPCODES.HEARTBEAT: {
        clearInterval(heartbeat);
        const payload = { op: 1, d: last_sequence };
        socket.send(JSON.stringify(payload));
        heartbeat = startHeartbeat(socket, last_sequence, heartBeatIntervalMS);
        break;
      }

      // Opcode 7: server requests reconnect. Client must close and reconnect (resume or identify), not send op 7.
      case OPCODES.RECONNECT: {
        console.log(
          "Received reconnect opcode from server. Closing and reconnecting ...",
        );
        socket.close();
        break;
      }

      // hello event received after connecting to the gateway
      case OPCODES.HELLO: {
        console.log(`Received opcode 10`);
        heartBeatIntervalMS = d.heartbeat_interval;
        heartbeat = startHeartbeat(socket, last_sequence, heartBeatIntervalMS);
        if (isReconnecting) {
          sendResume(socket, token, session_id, last_sequence);
        } else {
          sendIdentify(socket, token);
        }
        break;
      }

      // heartbeat ack
      case OPCODES.HEARTBEAT_ACK: {
        console.log("heartbeat response has been acknowledged");
        break;
      }

      default: {
        console.log("Unknown opcode:", OPCODES[op]);
        break;
      }
    }
  });

  socket.on("error", (err) => {
    console.error("WebSocket error:", err.message);
  });

  socket.on("close", (code, reason) => {
    console.log("WebSocket closed with code:", code, reason?.toString() || "");
    if (heartbeat) clearInterval(heartbeat);

    if (resume_gateway_url && session_id && reconnect_attempts < 5) {
      reconnect_attempts++;
      console.log("Resume connection is possible. Attempting to resume ...");
      currentSocket = new WebSocket(`${resume_gateway_url}${queryParams}`);
      connectToGateway(currentSocket, true);
    } else {
      console.log(
        "No resume gateway URL or session ID. Starting a new connection ...",
      );
      resetValues();
      getGateway();
    }
  });
};

getGateway();
