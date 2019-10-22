function Set() {
  this._data = {}
}

Set.prototype.add = function(value) {
  this._data[value] = true
  return this
}

Set.prototype.remove = function(value) {
  delete this._data[value]
  return this
}

Set.prototype.data = function() {
  return Object.keys(this._data)
}

Set.prototype.has = function(value) {
  return !!this._data[value];
}

Set.prototype.forEach = function(callback) {
  
  var data = this.data()
  
  for (var i = 0; i < data.length; i++) {
    callback(data[i])
  }
}

function objectToArray(obj) {
  
  var result = []
  var keys = Object.keys(obj)

  for (var i = 0; i < keys.length; i++)
    result.push(obj[keys[i]])
  
  return result
}
