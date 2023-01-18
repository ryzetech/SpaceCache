const config = require("./config.json");
const spaces = require("./spaces.json");

const { setInterval } = require("node:timers/promises");
const fetch = require("node-fetch");

const NodeCache = require("node-cache");
const jp = require('jsonpath');

const cache = new NodeCache({ stdTTL: config.checkperiod * 3 });

(async function () {
  for await (const time of setInterval(config.checkperiod * 10)) {
    console.log("Checking for spaces...");
    for (const space of spaces) {
      console.log(`Checking ${space.id}...`);
      let o = await checkSpace(space);
      console.log(`Space ${space.id} is ${o ? "open" : "closed"}`);
    }
  }
})();

async function checkSpace(space) {
  const response = await fetch(space.endpoint);
  const data = await response.json();
  let open;

  if (!space.path) {
    try { open = data.state.open; }
    catch { console.error(`The space ${space.id} is not using the SpaceAPI standard. Please specify a path.`); }
  } else {
    try { open = (jp.query(data, space.path) == (space.expected ? space.expected : true)); }
    catch { console.error(`The space ${space.id} has an invalid JSONPath to the target value. Please use https://jsonpath.com/ to evaluate the path.`); }
  }
  return open;
}