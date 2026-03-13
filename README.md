An application that interacts directly with the [Discord API](https://docs.discord.com/developers/reference).

Instead of using one of the existing libraries that abstract the entire logic in extremely easy to use functions and methods, i prefer trying to connect and set up everything on my own, just to get a feel for the entire process.

<hr/>

Uses the [Gateway API](https://docs.discord.com/developers/quick-start/overview-of-apps#gateway-api) to establish a websocket connection with discord that sends and receives data in real time. the connection url is fetched from  
```javascript
  const headers = new Headers({
    "User-Agent":
      "DiscordBot (https://github.com/discord/discord-api-docs, 1.0.0)",
  });
  const request = await fetch(`https://discord.com/api/gateway`, {
    headers,
  });
  const response = await request.json();
  const wsConnectionUrl = response.url;
```

In order to successfuly run `app.js`, a **bot token** is needed in order to [Identify](https://docs.discord.com/developers/events/gateway#identifying) after initiating the [Heartbeat Interval](https://docs.discord.com/developers/events/gateway-events#heartbeat)

Development mode `(process.env.NODE_ENV='dev')`  is used to keep logs in files `identifies.json` and `sessions.json`:
- **Identifies** are used to keep track of how many times I have identified; resets after 24 hours (to keep rate limiting in mind)
- **Sessions** are used mostly to keep track of the latest one, for reconnectiong testing. Not needed to run the app
