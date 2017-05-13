var async = require('async');
/**
 * Backfill sanitize the dojo info
 * @param  {Object}   data      Object containing subject and content of the email
 */
module.exports = function (args, done) {
  var seneca = this;
  var plugin = args.role;
  async.waterfall([
    getCDFUser,
    queueDojosToBeUpdated
  ], done);
  function getCDFUser (wfCb) {
    seneca.act({role: 'cd-users', cmd: 'list', query: {roles: '{cdf-admin}'}}, function (err, users) {
      if (err) return done(err);
      wfCb(null, users[0]);
    });
  }
  function queueDojosToBeUpdated (user, wfCb) {
    seneca.act({role: plugin, cmd: 'list', query: {deleted: 0}}, function (err, dojos) {
      if (err) return done(err);
      async.each(dojos, function (dojo, cb) {
        var task = {role: plugin, cmd: 'sanitizeDojo', id: dojo.id, user: user};

        seneca.act({role: 'kue-queue', cmd: 'enqueue', name: 'dojo-generic-kue', msg: task, params: {
          priority: 'high',
          delay: 10000
        }}, cb);
      }, wfCb);
    });
  }
};
