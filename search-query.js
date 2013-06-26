var crypto = require('crypto');

var normaliseQueryString = function(request, response, next) {
  var params = Object.getOwnPropertyNames(request.query).sort();
  var paramStrings = [];
  params.forEach(function (param) {
    switch(param) {
      case 'sort':
      case 'ord':
      case 'pg':
      case 'ps':
        // exclude these
        break;
      case 'hids':
      case 'fi':
      case 'sr':
      case 'gr':
      case 'at':
      case 'ap':
        paramStrings.push(param + '=' + request.params[param].split(',').sort().join(','));
        break;
      default:
        paramStrings.push(param + '=' + request.params[param]);
        break;
    }  
  });
  request.normalisedQueryString = paramStrings.join('&');
  next();
}

var parseSearchQuery = function(request, response, next) {
  
  var asString = function(strVal) { return strVal; }
  var asDate = function(strVal) { return new Date(strVal); }
  var asInteger = parseInt;
  var asFloat = parseFloat;
  var asObject = JSON.parse;
  var asArrayOfString = function(strVal) { return strVal.split(','); }
  var asArrayOfInt = function(strVal) {
    var ints = [];
    strVal.split(',').forEach(function(item){
      ints.push(parseInt(item));
    });
    return ints;
  }
  var asOrderedArrayOfInt = function(strVal) {
    return asArrayOfInt(strVal).sort();
  }

  var get = function(param, transform, defaultValue) {
    return request.query[param]
      ? transform(request.query[param])
      : defaultValue;
  }

  request.search = {};

  request.search.hotelIds    = get('hids', asOrderedArrayOfInt);
  request.search.areaId      = get('aid', asInteger);
  request.search.location    = get('loc', asObject);
  request.search.radius      = get('r', asFloat);
  request.search.polygon     = get('poly', asObject);

  request.search.date           = get('d', asDate, new Date());
  request.search.nights         = get('n', asArrayOfInt, [1]);
  request.search.adults         = get('a', asInteger, 2);
  request.search.children       = get('c', asInteger, 0);
  request.search.maxPrice       = get('pmax', asFloat);
  request.search.minPrice       = get('pmin', asFloat);
  request.search.specialOffers  = get('s', asString);

  request.search.facilities         = get('fi', asOrderedArrayOfInt);
  request.search.appeals            = get('ap', asOrderedArrayOfInt);
  request.search.accommodationTypes = get('at', asOrderedArrayOfInt);
  request.search.starRatings        = get('sr', asOrderedArrayOfInt);
  request.search.guestRatings       = get('gr', asOrderedArrayOfInt);

  request.page = {};
  request.page.number     = get('pg', asInteger, 1);
  request.page.size       = get('ps', asInteger, 50);

  request.sort = {};
  request.sort.order      = get('sort', asString);
  request.sort.descending = (get('ord', asString) == 'desc');
  
  request.currency = get('cur', asString, 'GBP');

  var cacheKey = crypto.createHash('md5');
  cacheKey.update(JSON.stringify(request.search));
  request.cacheKey = cacheKey.digest('hex');

  next();
}

module.exports.parse = function() {
  return [ 
    normaliseQueryString,
    parseSearchQuery
  ];
};
