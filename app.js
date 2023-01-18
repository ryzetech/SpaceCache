// load configs and spaces
const config = require("./config.json");
const spaces = require("./spaces.json");

// load modules
const { setInterval } = require("node:timers/promises");
const fetch = require("node-fetch");
const express = require("express");
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const NodeCache = require("node-cache");
const jp = require('jsonpath');

// set up things
const cache = new NodeCache({ stdTTL: config.checkperiod * 3 });

let schema = buildSchema(`
  type Query {
    
`);

let root = {

};


let app = express();
app.use('/json', express.json());
/*
app.use('/graphql', graphqlHTTP({

}));
*/

// CHECK LOOP
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

// HELPER FUNCTIONS
async function checkSpace(space) {
  let response, data, open;
  try {
    response = await fetch(space.endpoint);
    data = await response.json();
  } catch (e) { console.error(`The space ${space.id} might not be reachable. Please check the endpoint. Error: ${e}`); }

  if (!space.path) {
    try { open = data.state.open; }
    catch { console.error(`The space ${space.id} is not using the SpaceAPI standard. Please specify a path.`); }
  } else {
    try { open = (jp.query(data, space.path) == (space.expected ? space.expected : true)); }
    catch { console.error(`The space ${space.id} has an invalid JSONPath to the target value. Please use https://jsonpath.com/ to evaluate the path.`); }
  }
  return open;
}