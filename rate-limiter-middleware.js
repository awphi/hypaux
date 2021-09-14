const lambdaRL = require("lambda-rate-limiter");
const { createError } = require("@middy/util");
const defaults = {
  interval: 10000, // rate limit interval in ms, starts on first request
  uniqueTokenPerInterval: 300, // excess causes earliest seen to drop, per instantiation
  maxRequestsPerInterval: 100,
};

module.exports = (opts = {}) => {
  const options = { ...defaults, ...opts };
  const limiter = lambdaRL(options);

  const rateLimitBefore = async (request) => {
    try {
      await limiter.check(
        options.maxRequestsPerInterval,
        request.event.headers["client-ip"]
      );
    } catch {
      const error = createError(429, "Rate limit reached. Try again later.");
      request.event.headers = { ...request.event.headers };
      throw error;
    }
  };

  return {
    before: rateLimitBefore,
  };
};
