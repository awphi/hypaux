const middy = require("@middy/core");
const errorLogger = require("@middy/error-logger");
const { getItemDefinitions } = require("./item-definition-api.js");

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
