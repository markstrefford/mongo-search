var http = require('http');


module.exports.exchangeRates = function() {
  var currencies = {};
  var request = http.request({
    host: 'currency.services.laterooms.com',
    path: '/service.svc/currencies',
    method: 'GET'
  }, function (response) {
    var s = '';
    response.on('data', function(buffer) {
      s += buffer.toString();
    });
    response.on('end', function() {
      JSON.parse(s).forEach(function(currency) {
        currencies[currency.ID] = currency.Rate;
      });
      console.log(JSON.stringify(currencies));
    });
  });
  request.end();
  
  return function(request, response, next){
    request.exchangeRates = currencies;
    next();
  }
}
