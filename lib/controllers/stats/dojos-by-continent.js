var _ = require('lodash');
/**
 * cmd_get_stats - query cd_stats for all stats
 *
 * @return {Object}      Aggregation of dojos number per continent
 */
module.exports = function cmd_get_stats (args, done) {
  var STATS_ENTITY_NS = 'cd/stats';
  var seneca = this;
  var role = args.role;
  seneca.make$(STATS_ENTITY_NS).list$({ limit$: 'NULL' },
   function (err, dojos) {
    if (err) return done(err);
    var dojoMappedByContinent = {};
    _.forEach(dojos, function (dojo) {
      if (!dojoMappedByContinent[dojo.continent]) {
        dojoMappedByContinent[dojo.continent] = [];
      }
      dojoMappedByContinent[dojo.continent].push(dojo);
    });
    done(null, dojoMappedByContinent);
  });
}
