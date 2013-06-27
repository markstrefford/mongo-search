function statsHandler(req, data) {
  for (var i in data) {
    req.stats[i] = data[i];
  }
}

function Stats(server) {
  server.on("after", function (req, res, route, e) {
    console.log("stats for this request:", req.stats);
    server.emit("stats", req.stats || {});
  });

  return function (req, res, next) {
    req.on("stats", function (data) { statsHandler(req, data); });
    req.stats = {};
    next();
  };
}

module.exports = Stats;

