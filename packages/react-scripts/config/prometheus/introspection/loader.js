'use strict';

module.exports = function introspectionLoader(source) {
  this.cacheable();
  return source;
}

module.exports.pitch = function introspectionLoaderPitch(remainingRequest) {
  this.cacheable();
  var query = JSON.parse(this.query.slice(1));
  if (query.name) {
    this._compiler.__introspectables[this.resourcePath] = query.name;
  }
  return `module.exports = require(${JSON.stringify('-!' + remainingRequest)});`;
}
