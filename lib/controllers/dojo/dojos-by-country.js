var _ = require('lodash');

/**
 * cmd_dojos_by_country - List of dojos grouped by countries, ordered by alpha2
 *
 * @param  {Object} query
 * @return {Object}      a list of dojo per key; a key per country
 */
module.exports = function cmd_dojos_by_country (args, done) {
  var seneca = this;
  var role = args.role;
  var query = args.query;
  var dojosByCountry = {};
  if (!_.isEmpty(query)) {
    seneca.act({role: role, ctrl: 'dojo_public_fields', cmd: 'list', query: query},
     function (err, dojos) {
      if (err) return done(err);
      _.each(dojos, function (dojo) {
        if (!dojosByCountry[dojo.countryName]) dojosByCountry[dojo.countryName] = [];
        dojosByCountry[dojo.countryName].push(dojo);
      });

      _.each(Object.keys(dojosByCountry), function (countryName) {
        dojosByCountry[countryName] = _.sortBy(dojosByCountry[countryName], function (dojos) {
          return dojos.name.toLowerCase();
        });
      });
      return done(null, dojosByCountry);
    });
  } else {
    done(new Error('Missing parameter query'));
  }
};
