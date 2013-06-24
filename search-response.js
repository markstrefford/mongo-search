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


var constructResponse = function(request, response, next) {
  
  //request.eTag = crypto.createHash('md5');

  request.rateResponse.sort(request.sort.descending
                            ? descending(sortBy[request.sort.order])
                            : sortBy[request.sort.order]);

  response.setHeader('X-HotelsAvailable', request.rateResponse.length.toString());
  response.setHeader('X-HotelCount', request.ids.length.toString());
  //response.setHeader('ETag', request.eTag.digest('hex'));

  var page = request.page.number; 
  var size = request.page.size;
  var sortQuery =  (request.sort.order ? '&sort=' + request.sort.order : '') + '&ord=' + (request.sort.descending ? 'DESC' : 'ASC' ) + '&ps=' + size;
  if(page > 1) {
    response.setHeader('X-Prev', 'http://localhost:9090/hotels?' 
      + request.normalisedQueryString 
      + sortQuery + '&pg=' + (page-1));
  }
  if(page*size < request.rateResponse.length) {
    response.setHeader('X-Next', 'http://localhost:9090/hotels?' 
      + request.normalisedQueryString 
      + sortQuery + '&pg=' + (page+1));
  }

  response.send(request.rateResponse.slice((page-1)*size, page*size));
  next();
};

module.exports.constructResponse = function() {
  return [
           constructResponse
         ];
}

