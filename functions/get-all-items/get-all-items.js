const middy = require("@middy/core");
const httpErrorHandler = require("@middy/http-error-handler");
// TODO introduce rate limiting once it works

const faunadb = require("faunadb");
const q = faunadb.query;

var client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET,
});

const handler = async (event, context) => {
  console.log(process.data);
  //TODO write some middy middleware so we can prefix params with fauna_ to automatically do this
  const after = event.queryStringParameters.fauna_after
    ? faunadb.parseJSON(event.queryStringParameters.fauna_after)
    : undefined;

  const before = event.queryStringParameters.fauna_before
    ? faunadb.parseJSON(event.queryStringParameters.fauna_before)
    : undefined;

  try {
    const response = await client.query(
      q.Paginate(q.Match(q.Index("all_items_by_internalname")), {
        before: before,
        after: after,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    throw {
      statusCode: 400,
      message: JSON.stringify(error),
    };
  }
};

exports.handler = middy(handler).use(httpErrorHandler());
