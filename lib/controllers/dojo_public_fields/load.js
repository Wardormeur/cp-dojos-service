var _ = require('lodash');
/**
 * cmd_load - Load a dojo by its id
 *
 * @param  {String} id
 * @return {Object}      The expected dojo
 */
module.exports = function cmd_load (args, done) {
  var seneca = this;
  var id = args.id;
  if (!_.isEmpty(id)) {
    seneca.make$('v/dojos_public_fields').load$(id, done);
  } else {
    done(new Error('Missing parameter id'));
  }
}
