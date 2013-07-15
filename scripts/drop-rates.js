var collections = db.getCollectionNames();

for (var i = 0; i < collections.length; i++) {
  var collection = collections[i];
  if(collection.startsWith('Rates')) {
    db[collection].drop();
  }
}
