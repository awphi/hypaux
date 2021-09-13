const middy = require("@middy/core");
const errorLogger = require("@middy/error-logger");

const faunadb = require("faunadb");
const q = faunadb.query;

var client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET,
});

const handler = async (event, context) => {
  var response;
  try {
    response = await client.query(
      q.Get(
        q.Match(
          q.Index("item_by_internalname"),
          event.queryStringParameters.item
        )
      )
    );
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify(error),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(response.data),
  };
};

exports.handler = middy("@middy/core").use(errorLogger());
