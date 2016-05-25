'use strict';
var _ = require('lodash');

var config = require('../config/config.js')();

var seneca = require('seneca')();

var argv = require('optimist')
  .boolean('d')
  .alias('d', 'withcleanup')
  .argv;

seneca.log.info('using config', JSON.stringify(config, null, 4));
seneca.options(config);

seneca.use('postgresql-store');

seneca
  .use('../dojos.js', {
    limits: config.limits,
    shared: config.shared,
  })
  .use('../test/stubs/email-notifications.js')
  .use(require('../test/lib/test-dojo-data.js'));

seneca.listen()
.client({type: 'web', port: 10303, pin: 'role:cd-profiles,cmd:*'})
.client({type: 'web', port: 10303, pin: 'role:cd-users,cmd:*'})
.client({type: 'web', port: 10303, pin: 'role:test-user-data,cmd:*'})
.client({type: 'web', port: 10306, pin: 'role:test-event-data,cmd:*'});

seneca.ready(function() {
  function docleanup(done) {
    if (argv.withcleanup) {
      seneca.act({ role: 'test-dojo-data', cmd: 'clean', timeout: false }, done);
    }
    else {
      setImmediate(done);
    }
  }

  docleanup( function () {
    console.log('Service cleaned');
    console.log('Service ready for initialization');
  });

});
