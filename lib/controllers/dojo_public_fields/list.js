var _ = require('lodash');
/**
 * cmd_list - List dojos matching passed criterias
 *
 * @param  {Object} query object describing dojos to be searched
 * @return {Array}      List of dojos with their public fields
 */
module.exports = function cmd_list (args, done) {
  var seneca = this;
  var role = args.role;
  var query = args.query;
  if (!_.isEmpty(query)) {
    if (!query.limit$) query.limit$ = 'NULL';
    if (query.mysqlDojoId && query.mysqlDojoId.toString().length > 8) return done(null, []);
    seneca.make$('v/dojos_public_fields').list$(query, done);
  } else {
    done(new Error('Missing parameter query'));
  }
};
