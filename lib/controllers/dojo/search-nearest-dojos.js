var pg = require('pg');
var _ = require('lodash');

/**
 * cmd_search_nearest_dojos - Search for a dojo corresponding to a name,
 *  ordered by distance from passed location
 *
 * @param  {Number} lat latitude of the reference
 * @param  {Number} lon longitude of the reference
 * @param  {String} search name
 * @return {Array}      Dojos distances to the reference
 */
module.exports = function cmd_search_nearest_dojos (args, done) {
  var seneca = this;
  var senecaPgOptions = _.clone(seneca.options()['postgresql-store']);
  senecaPgOptions.database = _.get(senecaPgOptions, 'name');
  senecaPgOptions.user = _.get(senecaPgOptions, 'username');

  var searchLat = args.query.lat;
  var searchLon = args.query.lon;

  var search = args.query.search || null;

  var psqlQuery;
  var psqlQueryVariables;

  if (search) {
    search = '%' + search + '%';
    psqlQuery = "SELECT *, earth_distance(ll_to_earth($1, $2), ll_to_earth((geo_point->'lat')::text::float8, (geo_point->'lon')::text::float8)) AS distance_from_search_location FROM v_dojos_public_fields WHERE stage != 4 AND verified != 0 AND deleted != 1 OR name ILIKE $3 ORDER BY distance_from_search_location ASC LIMIT 10";
    psqlQueryVariables = [searchLat, searchLon, search];
  } else {
    return done(null, []);
  }

  pg.connect(senecaPgOptions, function (err, client) {
    if (err) return done(err);
    client.query(psqlQuery, psqlQueryVariables, function (err, results) {
      if (err) return done(err);
      client.end();
      // _.each(results.rows, function (dojo) {
      //   dojo.user_invites = purgeInviteEmails(dojo.user_invites);
      //   dojo = purgeEBFields(dojo);
      // });
      return done(null, results.rows);
    });
  });
};
