var pg = require('pg');
var _ = require('lodash');
var purgeEBFields = require('./../../utils/dojo/purgeEBFields');
var purgeInviteEmails = require('./../../utils/dojo/purgeInviteEmails');

/**
 * cmd_search_bounding_box - Search for a dojo in a passed down area
 *
 * @param  {Number} lat latitude of the center of the bounding box
 * @param  {Number} lon longitude of the center of the bounding box
 * @param  {Number} radius radius of search
 * @param  {String} search name
 * @return {Array}      Dojos in the searched area
 */
module.exports = function cmd_search_bounding_box (args, done) {
  var seneca = this;
  var senecaPgOptions = _.clone(seneca.options()['postgresql-store']);
  senecaPgOptions.database = _.get(senecaPgOptions, 'name');
  senecaPgOptions.user = _.get(senecaPgOptions, 'username');

  var searchLat = args.query.lat;
  var searchLon = args.query.lon;
  var boundsRadius = args.query.radius;
  var search = args.query.search || null;

  var psqlQuery;
  var psqlQueryVariables;
  if (search) {
    search = '%' + search + '%';
    psqlQuery = "SELECT *, earth_distance(ll_to_earth($1, $2), ll_to_earth((geo_point->'lat')::text::float8, (geo_point->'lon')::text::float8)) AS distance_from_search_location FROM v_dojos_public_fields WHERE stage != 4 AND deleted != 1 AND verified != 0 AND (earth_box(ll_to_earth($1, $2), $3) @> ll_to_earth((geo_point->'lat')::text::float8, (geo_point->'lon')::text::float8) OR name ILIKE $4) ORDER BY distance_from_search_location ASC";
    psqlQueryVariables = [searchLat, searchLon, boundsRadius, search];
  } else {
    psqlQuery = "SELECT *, earth_distance(ll_to_earth($1, $2), ll_to_earth((geo_point->'lat')::text::float8, (geo_point->'lon')::text::float8)) AS distance_from_search_location FROM v_dojos_public_fields WHERE stage != 4 AND deleted != 1 AND verified != 0 AND earth_box(ll_to_earth($1, $2), $3) @> ll_to_earth((geo_point->'lat')::text::float8, (geo_point->'lon')::text::float8) ORDER BY distance_from_search_location ASC";
    psqlQueryVariables = [searchLat, searchLon, boundsRadius];
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
}
