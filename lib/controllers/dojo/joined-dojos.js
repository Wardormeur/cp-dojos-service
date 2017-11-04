var async = require('async');
var _ = require('lodash');
/**
 * Returns a list of dojo for the current user
 * @param  {Object}   query Filters
 * @return {Array}        List of dojos joined
 */
// TODO : merge with dojos-for-user?
// TODO : define which params are used for query
module.exports = function (args, done) {
  var seneca = this;
  var user = args.user;
  var query = args.query;
  var plugin = args.role;
  function loadUserMembership (wfCb) {
    seneca.act({role: plugin, entity: 'userdojo', cmd: 'list',
      query: { userId: user.id, deleted: 0, limit$: 'NULL' }}, wfCb);
  }
  function loadUserDojos (userDojos, wfCb) {
    if (!userDojos || !userDojos.length) {
      return wfCb(null, [], [], []);
    }
    var dojoIds = _.uniq(_.map(userDojos, 'dojoId'));
    var filters = _.omit(query, ['sort$', 'skip$', 'limit$']);
    var ordering = _.pick(query, ['sort$', 'skip$', 'limit$']);
    var andCondition = [{id: {in$: dojoIds}}];
    if (!_.isEmpty(filters)) andCondition.unshift(filters)
    query = _.extend({ and$: andCondition }, ordering);
    seneca.act({role: plugin, ctrl: 'dojo_public_fields', cmd: 'list', query: query},
      _.partialRight(wfCb, userDojos, dojoIds));
  }
  function formatResult (dojos, userDojos, dojoIds, wfCb) {
    return wfCb(null, {
      // NOTE : this is wrong : an unverified dojo will be counted
      total: dojoIds.length,
      records: dojos
    });
  }
  async.waterfall([
    loadUserMembership,
    loadUserDojos,
    formatResult
  ], done);
};
