

var detailedRates = function(request, response, next) {
  var db = request.db;
  var collection = db.collection('Rates'+request.params.year+request.params.month+request.params.date);
  var projection = {hi:1,_id:0};
  projection[request.params.nights] = 1;
  
  collection.findOne({_id: request.params.id},projection, function(err,doc){
    response.send(err||doc);
  });
  next();
}

module.exports.getAllRates = function() {
  return detailedRates;
};
