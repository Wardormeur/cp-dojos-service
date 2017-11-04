var _ = require('lodash');
/**
 * cmd_find - Look for a non-deleted dojo
 * it is basically a load but with a query instead of an id
 *
 * @param  {Object} query the selector to find the dojo
 * @return {type}      A Dojo with its public info
 */
 // TODO : define what fields are supported in query
 // as load will not report if multiple rows are matching and will take the 1rst
module.exports = function cmd_find (args, done) {
  var seneca = this;
  var role = args.role;
  var query = args.query;
  if (!_.isEmpty(query)) {
    query.deleted = 0;
    seneca.act({ role: role,
      ctrl: 'dojo_public_fields',
      cmd: 'load', id: query },  done); // id can accept query thanks to seneca's magic
  } else {
    done(new Error('Missing parameter query'));
  }
}
