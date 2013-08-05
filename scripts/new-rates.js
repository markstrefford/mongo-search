function createCollection(date) {
  var name = 'Rates' + date.toISOString().slice(0,10).replace('-','').replace('-','');
  db[name].ensureIndex({ 'n': 1, 'h': 1 });
}

var today = new Date()*1;
var day = 24*60*60*1000;
for(i=0; i < 366; i++) {
  createCollection(new Date(today + i*day));
}
