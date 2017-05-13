var _ = require('lodash');
var async = require('async');
var sanitizeHtml = require('sanitize-html');
/**
 * Backfill sanitize the dojo info
 * @param  {Object}   data      Object containing subject and content of the email
 */
module.exports = function (args, done) {
  var seneca = this;
  var so = seneca.options;
  var plugin = args.role;
  var dojoId = args.id;
  var user = args.user;
  async.waterfall([
    getDojo,
    saveDojo
  ], done);
  function getDojo (wfCb) {
    seneca.act({role: plugin, cmd: 'load', id: dojoId}, wfCb);
  }
  function saveDojo (dojo, wfCb) {
    dojo.name = sanitizeHtml(dojo.name);
    dojo.notes = sanitizeHtml(dojo.notes, so.sanitizeTextArea);
    dojo.countryName = sanitizeHtml(dojo.countryName);
    seneca.act({role: plugin, cmd: 'update', dojo: dojo, user: user}, wfCb);
  }
};
