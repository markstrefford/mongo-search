

var filterByFacilities = function(request, response, next, param) {
  request.filter.fi = {$all: []};
  
  request.query[param].split(',').forEach(function(id) {
    request.filter.fi.$all.push(parseInt(id));
  });

  next();
}

var filterByStarRating = function(request, response, next, param) {
  request.filter.nsr = {$in: []};

  request.query[param].split(',').forEach( function(id) {
    request.filter.nsr.$in.push(parseInt(id));
  });
  next();
}

var filterByGuestRating = function(request, response, next, param) {
  request.filter['re.LateRooms.asi'] = {$in: []}

  request.query[param].split(',').forEach(function(rating) {
    request.filter['re.LateRooms.asi'].$in.push(parseInt(rating));
  });

  next();  
}

var filterByAccommodationType = function(request, response, next, param) {
  request.filter.at = {$in: []};
  request.query[param].split(',').forEach(function(id) {
    request.filter.at.$in.push(parseInt(id));
  });
  next();
}

var filterByAppeal = function(request, response, next, param) {
  request.filter.ap = {$all: []};
  request.query[param].split(',').forEach(function(id) {
    request.filter.ap.$all.push(parseInt(id));
  });
  next();
}

var ifSpecified = function(param, filter){
  return function(request, response, next) {
    if(!request.params[param]) {
      next();
      return;
    }
    if(!request.filter) request.filter = {};
    filter(request, response, next, param);
  }
}

module.exports.buildFilters = function() {
  return [
           ifSpecified('f', filterByFacilities),
           ifSpecified('sr', filterByStarRating),
           ifSpecified('gr', filterByGuestRating),
           ifSpecified('at', filterByAccommodationType),
           ifSpecified('ap', filterByAppeal)
         ];
}
