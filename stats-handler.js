var amqp = require("amqp")
//  , shm = require("shm")
  , metrics = require("metrics")
//  , nc = require("ncurses")
  ;

var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(8080);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var connection = amqp.createConnection(null, {reconnect: false}, function(conn) {
  console.log("ready");

  var exchange_options = {
    type: "topic",
    passive: false,
    durable: true,
    autoDelete: false,
    confirm: false
  };
  
  connection.exchange("events", exchange_options, function(exchange) {
    console.log("opened exchange");
    
    var queue_options = {
      passive: false,
      durable: false,
      exclusive: false,
      autoDelete: true
    };
    
    var stats = connection.queue("search-stats", {}, function (queue) {
      queue.bind(exchange.name, "search.stats");
      queue.subscribe(update_stats);
    });
    

  });
});

connection.on("error", function(err) {
  console.log("connection error:", err);
});

var counters = {
  response_time: new metrics.Timer,
  response_time_cached: new metrics.Timer,
  hotel_query_time: new metrics.Histogram,
  rates_query_time: new metrics.Histogram
};

function update_stats(message, headers, deliveryInfo) {

  if (message.location) {
    message.location.reverse();
    message.location.push(0.01);
    message.location.push(message.response_time % 21);
    
    sockets.forEach(function (socket) {
      socket.emit("search", message.location);
    });
  }
  
  if ("hit" === message.cache) {
    counters.response_time_cached.update(message.response_time);
  }
  else {
    counters.response_time.update(message.response_time);
    message.hotel_query_time && counters.hotel_query_time.update(message.hotel_query_time);
    message.rates_query_time && counters.rates_query_time.update(message.rates_query_time);
  }
}

function update_display() {
//  window.refresh();
  console.log("mean rate", counters.response_time.meanRate() + counters.response_time_cached.meanRate());
  console.log("response time (mean)", counters.response_time.mean());
  console.log("response time (min)", counters.response_time.min());
  console.log("response time (max)", counters.response_time.max());
  
  console.log("averages", counters.response_time.oneMinuteRate() + counters.response_time_cached.oneMinuteRate(), counters.response_time.fiveMinuteRate() + counters.response_time_cached.fiveMinuteRate(), counters.response_time.fifteenMinuteRate() + counters.response_time_cached.fifteenMinuteRate());
  
  var hits = counters.response_time_cached.count(),
      misses = counters.response_time.count(),
      total = hits + misses;
      
  console.log("cache hit rate", hits / total);
  
  console.log("cache misses", counters.response_time.count());
  console.log("cache hits", counters.response_time_cached.count());
  console.log("hotel query time", counters.hotel_query_time.mean());
  console.log("rates query time", counters.rates_query_time.mean());
  
  console.log();
}

var t = setInterval(update_display, 1000);

var sockets = [];

io.sockets.on('connection', function (socket) {

  sockets.push(socket);

 });