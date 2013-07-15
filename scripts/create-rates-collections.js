function createCollection(date) {
  var name = 'Rates' + date.toISOString().slice(0,10).replace('-','').replace('-','');
  db[name].ensureIndex({ '_id': 'hashed'});
  //sh.shardCollection('search.'+name, {'_id': 'hashed'});
}

var today = new Date()*1;
var day = 24*60*60*1000;
for(i=0; i < 366; i++) {
  createCollection(new Date(today + i*day));
}
