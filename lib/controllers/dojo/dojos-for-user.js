var _ = require('lodash');
/**
 * cmd_dojos_for_user - Load all dojos for a user
 * @param  {String} id  User id
 * @return {Array}      List of dojos
 */
 // TODO : merge with dojos-for-user?
module.exports = function cmd_dojos_for_user (args, done) {
  var seneca = this;
  var role = args.role;
  var id = args.id;
  var query = {
    userId: id,
    deleted: 0
  };
  if (!_.isEmpty(id)) {
    seneca.act({ role: role, cmd: 'load_usersdojos', query: query }, function (err, userDojoLink) {
      if (err) return done(err);
      if (userDojoLink.length > 0) {
        var dojoQuery = {
          id: { in$: _.map(userDojoLink, 'dojoId') },
          deleted: 0
        };
        seneca.act({ role: role, ctrl: 'dojo_public_fields', cmd: 'list', query: dojoQuery }, done);
      } else {
        done(null, []);
      }
    });
  } else {
    done(new Error('Missing parameter id'));
  }
}
