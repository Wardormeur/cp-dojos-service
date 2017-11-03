/**
 * Returns a list of dojo for the current user
 * @param  {Object}   query Filters
 * @return {Array}        List of dojos joined
 */
var async = require('async');
var _ = require('lodash');
// TODO : merge with dojos-for-user?
module.exports = function (args, done) {
  var user = args.user;
  var query = args.query;
  var plugin = args.role;
  var seneca = this;
  async.waterfall([
    function (done) {
      seneca.act({role: plugin, entity: 'userdojo', cmd: 'list',
        query: {userId: user.id, limit$: 'NULL', deleted: 0}}, done);
    },
    function (userDojos, done) {
      if (!userDojos || !userDojos.length) {
        return done(null, [], [], []);
      }
      var dojoIds = _.uniq(_.map(userDojos, 'dojoId'));
      var filters = _.omit(query, ['sort$', 'skip$', 'limit$']);
      var ordering = _.pick(query, ['sort$', 'skip$', 'limit$']);
      query = _.extend({and$: [filters, {id: {in$: dojoIds}}]}, ordering);
      seneca.act({role: plugin, ctrl: 'dojo_public_fields', cmd: 'list', query: query},
        _.partialRight(done, userDojos, dojoIds));
    },
    function (dojos, userDojos, dojoIds, done) {
      return done(null, {
        // NOTE : this is wrong : an unverified dojo will be counted
        total: dojoIds.length,
        records: dojos
      });
    }
  ], done);
};
