var crypto = require('crypto');

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
    return asArrayOfInt(strVal).sort(function(a,b){return a-b;});
  }

  var get = function(param, transform, defaultValue) {
    return request.query[param]
      ? transform(request.query[param])
      : defaultValue;
  }
  
  var baseUrl = [];

  request.search = {};

  if(request.search.hotelIds    = get('hids', asOrderedArrayOfInt))  baseUrl.push(['hids', request.search.hotelIds.join(',')]);
  if(request.search.areaId      = get('aid', asInteger))             baseUrl.push(['aid', request.search.areaId]);
  if(request.search.location    = get('loc', asObject))              baseUrl.push(['loc', JSON.stringify(request.search.location)]);
  if(request.search.radius      = get('r', asFloat))                 baseUrl.push(['r', request.search.radius]);
  if(request.search.polygon     = get('poly', asObject))             baseUrl.push(['poly', JSON.stringify(request.search.polygon)]);
  if(request.search.text        = get('q', asString))                baseUrl.push(['q', encodeURIComponent(request.search.text.toLowerCase())]);

  if(request.search.date           = get('d', asDate, new Date()))   baseUrl.push(['d', request.search.date.toJSON().slice(0,10)]); 
  if(request.search.nights         = get('n', asArrayOfInt, [1]))    baseUrl.push(['n', request.search.nights.join(',')]);
  if(request.search.adults         = get('a', asInteger, 2))         baseUrl.push(['a', request.search.adults]);
  if(request.search.children       = get('c', asInteger, 0))         baseUrl.push(['c', request.search.children]);
  if(request.search.maxPrice       = get('pmax', asFloat))           baseUrl.push(['pmax', request.search.maxPrice]);
  if(request.search.minPrice       = get('pmin', asFloat))           baseUrl.push(['pmin', request.search.minPrice]);
  if(request.search.specialOffers  = get('s', asString))             baseUrl.push(['s', request.search.specialOffers]);

  if(request.search.facilities         = get('fi', asOrderedArrayOfInt))   baseUrl.push(['fi', request.search.facilities.join(',')]);
  if(request.search.appeals            = get('ap', asOrderedArrayOfInt))   baseUrl.push(['ap', request.search.appeals.join(',')]);
  if(request.search.accommodationTypes = get('at', asOrderedArrayOfInt))   baseUrl.push(['at', request.search.accommodationTypes.join(',')]);
  if(request.search.starRatings        = get('sr', asOrderedArrayOfInt))   baseUrl.push(['sr', request.search.starRatings.join(',')]);
  if(request.search.guestRatings       = get('gr', asOrderedArrayOfInt))   baseUrl.push(['gr', request.search.guestRatings.join(',')]);

  request.page = {};
  request.page.number     = get('pg', asInteger, 1);
  if(request.page.size       = get('ps', asInteger, 50))                   baseUrl.push(['ps', request.page.size]);

  request.sort = {};
  if(request.sort.order      = get('sort', asString))                      baseUrl.push(['sort', request.sort.order]);
  if(request.sort.descending = (get('ord', asString) == 'desc'))           baseUrl.push(['ord', request.sort.descending ? 'desc' : 'asc']);
  
  request.currency = get('cur', asString, 'GBP');

  var cacheKey = crypto.createHash('md5');
  cacheKey.update(JSON.stringify(request.search));
  request.cacheKey = cacheKey.digest('hex');

  baseUrl.sort(function(a,b) { if(a[0]>b[0]) return 1; if(a[0]<b[0]) return -1; return 0;} );
  for(var i = 0; i < baseUrl.length; i++) {
    baseUrl[i] = baseUrl[i].join('=');
  }
  var baseQuery = baseUrl.join('&');

  request.getUrlForPage = function(pageNumber) {
    return [
             'http://',
             request.headers.host,
             request.path(),
             '?',
             baseQuery,
             '&pg=',
             pageNumber
           ].join('');
  }
  next();
}

module.exports.parse = function() {
  return [ 
    parseSearchQuery
  ];
};
