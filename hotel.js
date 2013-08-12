var restify = require('restify');
var mapHotel = function (hotel, distance) {
  var rating = hotel.re.LateRooms ? hotel.re.LateRooms.asi : null;

  var hotel = {
    hotelId: hotel.hi,
    name: hotel.hn,
    stars: hotel.nsr,
    rating: rating,
    'location': [hotel.l.lo,hotel.l.la],//{ lat: hotel.l.la, 'long': hotel.l.lo },
    address: hotel.add,
    currency: hotel.c,
  };
  if(distance) hotel.distance = distance;
  return hotel;
}

var buildFilter = function(search) {
  var filter = {};

  if(search.facilities) filter.fi = {$all: search.facilities};
  if(search.appeals) filter.ap = {$all: search.appeals};

  if(search.starRatings) filter.nsr = {$in: search.starRatings};
  if(search.guestRatings) filter['re.LateRooms.asi'] = {$in: search.guestRatings};
  if(search.accommodationTypes) filter.at = {$in: search.accommodationTypes};

  return filter;
}

var getHotelsByLocation = function (request, response, next) {

  if (!request.query.loc || request.hotels) {
    next();
    return;
  }
  request.emit('stats',{search_type: 'location'});

  request.hotels = {};

  var command = {
    geoNear: 'Hotels',
    near: request.search.location, 
    spherical: true,
    limit: 10000,
    maxDistance: request.search.radius / 3959,
    distanceMultiplier: 3959,
    query: buildFilter(request.search)
  };
  var start = Date.now();
  request.db.command( command , function(err, result) {
    if(err) {
      next(err);
      return;
    }
    request.ids = [];
    request.hotels = {};
    for(var i = 0; i < result.results.length; i++) {
      var hotel = result.results[i].obj;
      request.ids.push(hotel.hi);
      request.hotels[hotel.hi] = mapHotel(hotel, result.results[i].dis);
    }
    request.emit('stats', {
      hotel_query_time: Date.now() - start,
      hotel_count: request.ids.length
    });
    next();
  });

}

var executeQuery = function (query, request, response, next){
 
  var start = Date.now();
  var collection = request.db.collection('Hotels');
  request.ids = [];
  request.hotels = {};
  var stream = collection.find(
    query,
    { _id: 0, hi: 1, hn: 1, l: 1, nsr: 1, add: 1, 're.LateRooms.asi': 1, c: 1}
  ).stream();

  stream.on('error', function(err) {
    console.log(err);
    next(err);
  });

  stream.on('data', function(hotel) {
    request.ids.push(hotel.hi);
    request.hotels[hotel.hi] = mapHotel(hotel);
  });

  stream.on('end', function() {
    request.emit('stats', {
      hotel_query_time: Date.now() - start,
      hotel_count: request.ids.length
    });
    next();
  });
}

var getHotelsByIds = function (request, response, next) {

  if (!request.search.hotelIds || request.hotels) {
    next();
    return;
  }
  request.emit('stats',{search_type: 'ids'});
  var query = buildFilter(request.search);
  query.hi = {$in: request.search.hotelIds};

  executeQuery(query, request, response, next);
}

var getHotelsByArea = function (request, response, next) {

  if (!request.search.areaId || request.hotels) {
    next();
    return;
  }
  request.emit('stats',{search_type: 'area'});
  var query = buildFilter(request.search);
  query.ais = {$all: [request.search.areaId] };

  executeQuery(query, request, response, next);
}

var getHotelsWithinPolygon = function(request, response, next) {

  if (!request.search.polygon || request.hotels) {
    next();
    return;
  }

  request.emit('stats',{search_type: 'polygon'});
  var query = buildFilter(request.search);
  query.l = { $geoWithin: { $geometry: { type: 'Polygon', coordinates: request.search.polygon }}};

  executeQuery(query, request, response, next);
}

var getHotelsByName = function(request, response, next) {
  if (!request.search.text || request.hotels) {
    next();
    return;
  }

  request.emit('stats',{search_type: 'name'});
  var query = buildFilter(request.search);
  query.hn = { $regex: request.search.text, $options: 'i'}

  executeQuery(query, request, response, next);
}

var ensureWeHaveHotels = function(request, response, next) {
  if (request.hotels) {
    next();
    return;
  }
  var error = new restify.MissingParameterError('search not specified');
  error.statusCode = 400;
  return next(error);
}

module.exports.getHotels = function() {
  return [
           getHotelsByIds,
           getHotelsByArea,
           getHotelsByLocation,
           getHotelsWithinPolygon,
           getHotelsByName,
           ensureWeHaveHotels
         ];
}
