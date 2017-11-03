// TODO: separate perm
// TODO: use generic bootloader
module.exports = function () {
  return function (args, cb) {
    var seneca = this;
    if (args.dojo.eventbriteConnected) delete args.dojo.eventbriteConnected;
    seneca.make$('cd/dojos').save$(args.dojo, cb);
  };
};
