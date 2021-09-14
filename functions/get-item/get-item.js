const middy = require("@middy/core");
const rateLimiter = require("../../rate-limiter-middleware.js");
const httpErrorHandler = require("@middy/http-error-handler");

const faunadb = require("faunadb");
const q = faunadb.query;

var client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET,
});

const handler = async (event, context) => {
  try {
    const response = await client.query(
      q.Get(
        q.Match(
          q.Index("item_by_internalname"),
          event.queryStringParameters.item
        )
      )
    );

    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    throw {
      statusCode: 400,
      message: JSON.stringify(error),
    };
  }
};

// It seems netlify dev will reload the function file each time it's ran
// thus the rate limiter middleware is constantly remade and no state is stored
//  > WHY?!
exports.handler = middy(handler)
  .use(httpErrorHandler())
  .use(
    rateLimiter({
      interval: 10000,
      maxRequestsPerInterval: 10,
    })
  );
