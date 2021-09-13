const middy = require("@middy/core");
const errorLogger = require("@middy/error-logger");

const fetch = require("node-fetch");
const batchRequest = require("batch-request-js");

const faunadb = require("faunadb");
const {
  Create,
  Replace,
  If,
  Exists,
  Paginate,
  Match,
  Index,
  Let,
  Var,
  Select,
} = faunadb.query;

var client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET,
});

async function fetchItemDefinitions() {
  if (!process.env.GITHUB_SECRET) {
    throw "Cannot fetch new item database without GITHUB_SECRET set.";
  }

  const opts = {
    headers: {
      authorization: `token ${process.env.GITHUB_SECRET}`,
    },
  };

  const master = await fetch(
    "https://api.github.com/repos/Moulberry/NotEnoughUpdates-REPO/git/trees/master",
    opts
  ).then((a) => a.json());

  const itemsUrl = master.tree.filter((a) => a.path == "items")[0].url;

  const items = await fetch(itemsUrl, opts).then((a) => a.json());

  const reqs = (url) => {
    fetch(url, opts)
      .then((d) => d.json())
      .then((json) => Buffer.from(json.content, json.encoding).toString())
      .then((content) => JSON.parse(content));
  };

  return await batchRequest(
    items.tree.map((a) => a.url),
    reqs,
    { batchSize: 400, delay: 1000 }
  ).data;
}

async function loadLocalItemDefinitions() {
  var glob = require("glob");
  var path = require("path");

  const data = [];
  glob
    .sync("functions/update-item-definitions-background/item-data/**/*.json")
    .forEach((file) => {
      data.push(require(path.resolve(file)));
    });
  return data;
}

async function getItemDefinitions() {
  let defs = await fetchItemDefinitions();

  const items = [];
  defs.forEach((json) => {
    const key = json.internalname;
    if (
      key.endsWith("_SC") ||
      key.endsWith("_MINIBOSS") ||
      key.endsWith("_BOSS") ||
      key.endsWith("_MONSTER")
    ) {
      return;
    }

    items.push(json);
  });

  return items;
}

const handler = async (event, context) => {
  const defs = await getItemDefinitions();

  const promises = [];
  defs.forEach((def) => {
    const p = client
      .query(
        Let(
          {
            X: Match(Index("item_by_internalname"), def.internalname),
            y: { data: def },
          },
          If(
            Exists(Var("X")),
            Replace(Select([0], Paginate(Var("X"))), Var("y")),
            Create("items", Var("y"))
          )
        )
      )
      .then(() => {
        console.log("Updated/created item record for", def.internalname);
      });

    promises.push(p);
  });

  await Promise.all(promises);
};

exports.handler = middy(handler).use(errorLogger());
