// Requires the Fauna module and sets up the query module, which we can use to create custom queries.
const faunadb = require("faunadb");
const q = faunadb.query;

var client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET,
});

exports.handler = async (event, context) => {
  var response;
  try {
    response = await client.query(
      q.Get(
        q.Match(q.Index("item_internalname"), event.queryStringParameters.item)
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
