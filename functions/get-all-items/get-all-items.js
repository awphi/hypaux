const middy = require("@middy/core");
const errorLogger = require("@middy/error-logger");

const faunadb = require("faunadb");
const { Paginate, Match, Index } = faunadb.query;

var client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET,
});

const handler = async (event, context) => {
  // TODO write some middy middleware so we can prefix params with fauna_ to automatically do this
  const after = event.queryStringParameters.after
    ? faunadb.parseJSON(event.queryStringParameters.after)
    : undefined;

  const before = event.queryStringParameters.before
    ? faunadb.parseJSON(event.queryStringParameters.before)
    : undefined;

  const response = await client.query(
    Paginate(Match(Index("all_items_by_internalname")), {
      before: before,
      after: after,
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};

exports.handler = middy(handler).use(errorLogger());
