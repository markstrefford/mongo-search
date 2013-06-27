// set env NODE_DEBUG_AMQP=1 for debugging

var amqp = require("amqp");

var exchange_options = {
    type: "topic"
  , passive: false
  , durable: true
  , autoDelete: false
  , confirm: false
};

var connection
  , exchange
  , message_queue = [];

function initialise(options, server) {
  connection = amqp.createConnection(options, {reconnect: false}, function () {
    exchange = connection.exchange("events", exchange_options, function () {
      hook_up(server);
    });
  });

  connection.on("error", function (err) {
    console.log(["AMQP error: ", err].join(""));
  });
}

function hook_up(server) {
  server.on("stats", function (data) {
    publish(data);
  });
}

function publish(message) {
  exchange.publish("search.search", message);
}

module.exports.initialise = initialise;
module.exports.publish = publish;

