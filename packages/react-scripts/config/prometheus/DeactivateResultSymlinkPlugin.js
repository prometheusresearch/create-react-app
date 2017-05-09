'use strict';

class DeactivateResultSymlinkPlugin {

  apply(compiler) {
    var apply = compiler.resolvers.normal.apply.bind(compiler.resolvers.normal);
    compiler.resolvers.normal.apply = function() {
      var plugins = [];
      for (var i = 0; i < arguments.length; i++) {
        var plugin = arguments[i];
        if (plugin && plugin.constructor && plugin.constructor.name === 'ResultSymlinkPlugin') {
          continue;
        }
        plugins.push(plugin);
      }
      return apply.apply(null, plugins);
    };
  }
}

module.exports = DeactivateResultSymlinkPlugin;
