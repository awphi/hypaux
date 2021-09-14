const middy = require("@middy/core");
const errorLogger = require("@middy/error-logger");
const { getItemDefinitions } = require("./item-definition-api.js");

const faunadb = require("faunadb");
const q = faunadb.query;

var client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET,
});

const handler = async (event, context) => {
  const defs = await getItemDefinitions();

  const promises = [];
  defs.forEach((def) => {
    const p = client
      .query(
        q.Let(
          {
            X: q.Match(q.Index("item_by_internalname"), def.internalname),
            y: { data: def },
          },
          q.If(
            q.Exists(q.Var("X")),
            q.Replace(q.Select([0], q.Paginate(q.Var("X"))), q.Var("y")),
            q.Create("items", q.Var("y"))
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
