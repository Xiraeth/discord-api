const fs = require("fs");
const { MS_IN_DAY } = require("./constants");

const upsertSession = (newSessionId) => {
  const sessions = JSON.parse(fs.readFileSync("./sessions.json")).sessions;

  const existingSession = sessions.find((s) => s.id === newSessionId);

  if (existingSession) {
    existingSession.timestamp = new Date().toISOString();
  } else {
    sessions.push({
      id: newSessionId,
      timestamp: new Date().toISOString(),
    });
  }

  const data = {
    sessions,
  };

  fs.writeFileSync("./sessions.json", JSON.stringify(data));
  console.log("successfully updated sessions");
};

const hasItBeenADay = (date) => {
  if (!date) return true;

  const timestamp = new Date(date).getTime();

  const now = new Date();
  const nowTime = now.getTime();

  return nowTime - timestamp > MS_IN_DAY;
};

const updateIds = () => {
  let idsObject = {};
  const identifies = fs.readFileSync("./identifies.json", "utf8");

  const isObject = identifies
    ? typeof JSON.parse(identifies) === "object"
    : false;

  if (!isObject) {
    idsObject = {
      lastTimestamp: "",
      ids: 0,
    };
  } else {
    idsObject = JSON.parse(identifies);
  }

  if (
    idsObject.hasOwnProperty("lastTimestamp") &&
    idsObject.hasOwnProperty("ids")
  ) {
    const now = new Date();
    const nowDate = now.toISOString();
    const { ids = 0, lastTimestamp = "" } = idsObject;

    const data = { lastTimestamp, ids };

    if (hasItBeenADay(lastTimestamp)) {
      console.log("its been a day - updating timestamp and resetting id's");
      data.lastTimestamp = nowDate;
      data.ids = 1;
    } else {
      data.ids = ids + 1 || 1;
    }

    fs.writeFileSync("./identifies.json", JSON.stringify(data));
    console.log("successfully updated ids file");
  } else {
    const now = new Date().toISOString();
    const newData = {
      lastTimestamp: now,
      ids: 1,
    };
    fs.writeFileSync("./identifies.json", JSON.stringify(newData));
    console.log(
      "'identifies' file was empty - initialized with current date and id 1",
    );
  }
};

module.exports = {
  hasItBeenADay,
  updateIds,
  upsertSession,
};
