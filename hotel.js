var mapHotel = function (hotel, distance) {
  var rating = hotel.re.LateRooms ? hotel.re.LateRooms.asi : null;

  return {
    hotelId: hotel.hi,
    name: hotel.hn,
    stars: hotel.nsr,
    rating: rating,
    'location': { lat: hotel.l.la, 'long': hotel.l.lo },
    address: hotel.add,
    currency: hotel.c,
    distance: distance
  };
}

var getHotelsByLocation = function (request, response, next) {

  if (!request.query.loc || request.hotels) {
    next();
    return;
  }

  var loc = request.query.loc.split(',');
  request.hotels = {};

  var command = {
    geoNear: 'Hotels',
    near: [ parseFloat(loc[0]), parseFloat(loc[1]) ],
    spherical: true,
    limit: 1000,
    maxDistance: parseFloat(request.query.r || 10) / 3959,
    distanceMultiplier: 3959,
    query: request.filter
  };

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
    next();
  });

}

var executeQuery = function (query, request, response, next){
 
  var collection = request.db.collection('Hotels');
  request.ids = [];
  request.hotels = {};

  var stream = collection.find(
    query,
    { _id: 0, hi: 1, hn: 1, l: 1, nsr: 1, add: 1, 're.LateRooms.asi': 1, c: 1}
  ).stream();

  stream.on('data', function(hotel) {
    request.ids.push(hotel.hi);
    request.hotels[hotel.hi] = mapHotel(hotel);
  });

  stream.on('end', function() {
    next();
  });
}


var getHotelsByArea = function (request, response, next) {

  if (!request.query.aid || request.hotels) {
    next();
    return;
  }
  var query = request.filter || {};
  query.ais = {$all: [parseInt(request.query['aid'])] };

  executeQuery(query, request, response, next);
}

var getHotelsWithinPolygon = function(request, response, next) {

  if (!request.query.poly || request.hotels) {
    next();
    return;
  }

  var query = request.filter || {};
  query.l = { $geoWithin: { $geometry: { type: 'Polygon', coordinates: JSON.parse(request.query.poly) }}};

  executeQuery(query, request, response, next);
}

module.exports.getHotels = function() {
  return [
           getHotelsByArea,
           getHotelsByLocation,
           getHotelsWithinPolygon
         ];
}
