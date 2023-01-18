const config = require( "./config.json" );
const spaces = require( "./spaces.json" );

const { setInterval } = require( "node:timers/promises" );

const NodeCache = require( "node-cache" );
// const cron = require( "node-cron" );
const jp = require('jsonpath');

const cache = new NodeCache({ stdTTL: config.checkperiod*3 });

(async function() {
  for await (const time of setInterval(config.checkperiod*1000)) {
    console.log( "Checking for spaces..." );
    for (const space of spaces) {
      console.log( `Checking ${space.id}...` );
      let o = checkSpace(space);
    }
  }
})

async function checkSpace(space) {
  const response = await fetch(space.url);
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