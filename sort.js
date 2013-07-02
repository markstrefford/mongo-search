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

module.exports.sortBy = sortBy;
module.exports.descending = descending;
