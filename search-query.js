var crypto = require('crypto');

var asLowerString = {
  fromURI: function(str){ return str.toLowerCase(); },
  toURI: function(val){ return encodeURIComponent(val); }
}

var asUpperString = {
  fromURI: function(str){ return str.toUpperCase(); },
  toURI: function(val){ return encodeURIComponent(val); }
}

var asDate = {
  fromURI: function(str){ return new Date(str); },
  toURI: function(val){ return val.toJSON().slice(0,10); }
}

var asInteger = {
  fromURI: parseInt,
  toURI: function(val){ return val.toString(); }
}

var asFloat = {
  fromURI: parseFloat,
  toURI: function(val){ return val.toString(); }
}

var asObject = {
  fromURI: JSON.parse,
  toURI: JSON.stringify
}

var asArrayOfInt = {
  fromURI: function(str) {
    var ints = [];
    str.split(',').forEach(function(item){
      ints.push(parseInt(item));
    });
    return ints;
  },
  toURI: function(val) {
    return val.join(',');
  }
}

var asOrderedArrayOfInt = {
  fromURI: function(str){ return asArrayOfInt.fromURI(str).sort(); },
  toURI: asArrayOfInt.toURI
}

var asBoolean = {
  fromURI: function(str){ return str === 'true'; },
  toURI: function(val){ return val.toString(); }
}

var parseSearchQuery = function(request, response, next) {

  var get = function(param, transform, defaultValue) {
    return request.query[param]
      ? transform(request.query[param])
      : defaultValue;
  }

  var today = new Date(new Date().toJSON().slice(0,10));
  var parameters = {
    'hids': { convert: asOrderedArrayOfInt, mapTo: ['search', 'hotelIds'] },
    'aid':  { convert: asInteger,           mapTo: ['search', 'areaId'] },
    'loc':  { convert: asObject,            mapTo: ['search', 'location'] },
    'r':    { convert: asFloat,             mapTo: ['search', 'radius'] },
    'poly': { convert: asObject,            mapTo: ['search', 'polygon'] },
    'q':    { convert: asLowerString,       mapTo: ['search', 'text'] },

    'd':    { convert: asDate,              mapTo: ['search', 'date'],     defaultValue: today },
    'n':    { convert: asArrayOfInt,        mapTo: ['search', 'nights'],   defaultValue: [1] },
    'a':    { convert: asInteger,           mapTo: ['search', 'adults'],   defaultValue: 2 },
    'c':    { convert: asInteger,           mapTo: ['search', 'children'], defaultValue: 0 },
    'pmin': { convert: asFloat,             mapTo: ['search', 'minPrice'] },
    'pmax': { convert: asFloat,             mapTo: ['search', 'maxPrice'] },
    's':    { convert: asLowerString,       mapTo: ['search', 'specialOffers'] },

    'fi':   { convert: asOrderedArrayOfInt, mapTo: ['search', 'facilities'] },
    'ap':   { convert: asOrderedArrayOfInt, mapTo: ['search', 'appeals'] },
    'at':   { convert: asOrderedArrayOfInt, mapTo: ['search', 'accommodationTypes'] },
    'sr':   { convert: asOrderedArrayOfInt, mapTo: ['search', 'starRatings'] },
    'gr':   { convert: asOrderedArrayOfInt, mapTo: ['search', 'guestRatings'] },

    'pg':   { convert: asInteger,           mapTo: ['page', 'number'],     defaultValue: 1 },
    'ps':   { convert: asInteger,           mapTo: ['page', 'size'],       defaultValue: 50 },  

    'sort': { convert: asLowerString,       mapTo: ['sort', 'order'],      defaultValue: 'price' },
    'desc': { convert: asBoolean,           mapTo: ['sort', 'descending'], defaultValue: false },

    'cur':  { convert: asUpperString,       mapTo: ['currency'],           defaultValue: 'GBP' }
  }
  
  var baseURI = [];

  Object.getOwnPropertyNames(parameters).forEach(function(param){
    var parameter = parameters[param];
    var val = get(param, parameter.convert.fromURI, parameter.defaultValue);
    if(!val) return;
    if(param != 'pg') {
      baseURI.push([param, parameter.convert.toURI(val)]);
    }
    if(parameter.mapTo.length == 2) {
      if(!request[parameter.mapTo[0]]) request[parameter.mapTo[0]] = {};
      request[parameter.mapTo[0]][parameter.mapTo[1]] = val;
    } else {
      request[parameter.mapTo[0]] = val;
    }
  });

  var cacheKey = crypto.createHash('md5');
  cacheKey.update(JSON.stringify(request.search));
  cacheKey.update(request.sort.order);
  request.cacheKey = cacheKey.digest('hex');

  baseURI.sort(function(a,b) { if(a[0]>b[0]) return 1; if(a[0]<b[0]) return -1; return 0;} );
  for(var i = 0; i < baseURI.length; i++) {
    baseURI[i] = baseURI[i].join('=');
  }
  var baseQuery = baseURI.join('&');

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
