var crypto = require('crypto');

var sortBy = {
  price: function(a, b) {
    return a.rates.convertedPrice - b.rates.convertedPrice;
  },
  distance: function(a, b) {
    return a.distance - b.distance;
  },
  discount: function(a, b) {
    return (a.rates.rack / a.rates.price) - (b.rates.rack / b.rates.price);
  },
  rating: function(a, b) {
    return a.rating - b.rating;
  },
  stars: function(a, b) {
    return a.stars - b.stars;
  },
  name: function(a, b) {
    if(a.name < b.name) return -1;
    if(a.name > b.name) return 1;
    return 0;
  }
}

var descending = function(sort) {
  return function (a, b) {
    return sort(b, a);
  }
}

var from = function(request, rates, hotelCount, response, next) {
  rates.sort(request.sort.descending
    ? descending(sortBy[request.sort.order])
    : sortBy[request.sort.order]);

  var page = request.page.number; 
  var size = request.page.size;
  var sortQuery =  (request.sort.order ? '&sort=' + request.sort.order : '') + '&ord=' + (request.sort.descending ? 'desc' : 'asc' ) + '&ps=' + size;
  if(page > 1) {
    response.setHeader('X-Prev', 'http://localhost:9090/hotels?' 
      + request.normalisedQueryString 
      + sortQuery + '&pg=' + (page-1));
  }
  if(page*size < rates.length) {
    response.setHeader('X-Next', 'http://localhost:9090/hotels?' 
      + request.normalisedQueryString 
      + sortQuery + '&pg=' + (page+1));
  }

  var etag = crypto.createHash('md5');
  var resultPage = rates.slice((page-1)*size, page*size);
  var exchangeRate = request.exchangeRates[request.currency];
  resultPage.forEach(
    request.search.nights.length > 1
    ? function(result) { result.rates.forEach(function (rate){rate.convertedPrice *= exchangeRate; }); }
    : function(result) { result.rates.convertedPrice *= exchangeRate; }
  );
  etag.update(JSON.stringify(resultPage));

  response.setHeader('X-HotelsAvailable', rates.length.toString());
  response.setHeader('X-HotelCount', hotelCount.toString());
  response.setHeader('ETag', etag.digest('hex'));
  response.send(resultPage);
}

var constructResponse = function(request, response, next) {
  from(request, request.rateResponse, request.ids.length, response, next);
  next();
}

module.exports.from = from;
module.exports.constructResponse = function() {
  return [
           constructResponse
         ];
}

