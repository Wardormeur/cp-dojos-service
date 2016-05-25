'use strict';

var _ = require('lodash');
var async = require('async');

module.exports = function (options) {
  var seneca = this;
  var plugin = 'test-dojo-data';


  seneca.add({ role: plugin, cmd: 'insert' }, function (args, done) {

    console.log('Starting insert dojos');
    var dojos = require('../fixtures/dojos.json');
    var dojopin = seneca.pin({ role: 'cd-dojos', cmd: '*' });

    var registerLeads = function(done) {
      var nbChampions = 2;
      var steps = _.range(1, 6);
      seneca.act({ role:'cd-profiles', cmd:'list', query: {userType: 'champion'}, limit$: nbChampions}, function(err, champs){
        console.log('registerLeads: ', champs.length);
        async.forEachOfSeries(steps, function(step, index, cb){
          var dojoLead = {
            userId:     champs[index%nbChampions].userId,
            email:      champs[index%nbChampions].email,
            currentStep: step,
            converted: false, //Salesforce related, wdc for test data
            application: {
              dojoListing: {
                notes: "We need more cookies"
              }
            }
          };
          dojoLead.completed = dojoLead.currentStep === 5 ? true: false;
          dojopin.simple_save_dojo_lead({dojoLead: dojoLead}, cb);
        }, done);
      });
    };


    var registerDojos = function (done) {
        //  TODO: take as many dojos as we have of steps for dojos (1-7) on dojoleads
      dojopin.search_dojo_leads({query: {'currentStep': {'gte$': 4} }}, function(err, leads){
        if(err) return done(err);
        console.log('registerDojos: ', leads.length);
        async.forEachOfSeries(leads, function(lead, it, cb) {
          dojos[it].dojoLeadId = lead.id;
          dojos[it].email = lead.email;
          dojos[it].created = new Date();
          var user = {};
          user.id = lead.userId;


          dojopin.create({dojo: dojos[it], user: user }, function(err, response){
            if (err) return done(err);
            dojos[it].id = response.id;
            if (lead.currentStep === 5) {
              response.verified = 1;
              dojopin.update({dojo: response, user: user});
            }
            //  TODO: dynamise userType to be able to start a dojo without being a champion ?
            dojopin.save_usersdojos({userDojo: {userId: lead.userId, dojoId: response.id, owner:1, userTypes: ['champion']}}, cb);
          });
        }, done);
      });
    };

    var registerDojoUsers = function(done) {
      seneca.act({ role: 'cd-profiles', cmd: 'list', query: {userType: {nin$: ['champion', 'attendee-o13', 'attendee-u13']}}}, function(err, users){
        console.log('registerDojoUsers: ', users.length);
        async.forEachOfSeries(dojos, function(dojo, indexDojo, dojoDone) {
          async.forEachOfSeries(users, function(user, indexUser, cb){
          //   //  TODO : add different userTypes for association?
            dojopin.save_usersdojos({userDojo: {userId: user.userId, dojoId: dojo.id, userTypes: [user.userType]}}, function(err, dojoUser) {
              if(err) return done(err);
              cb(null, dojoUser);
            });
          }, dojoDone);
        }, done);
      });
    };

    //Since our µs is ungated by the main one, we can't use the cb to call for the next process step
    var callNext = function(done) {
      seneca.act({ role: 'test-event-data', cmd: 'insert', timeout: false, ungate: true}, done);
    };

    async.series([
      registerLeads,
      registerDojos,
      registerDojoUsers,
      callNext,
    ], function(err){
      if(err) return done(err);
      console.log('Insert of dojo data finished');
      done(null,{});
    });

  });

  seneca.add({ role: plugin, cmd: 'clean' }, function (args, done) {
    var dojopin = seneca.pin({ role: 'dojo', cmd: '*' });

    var deleteDojos = function (cb) {
      async.eachSeries(dojos, dojopin.delete, cb);
    };

    var deleteDojoUsers = function (cb) {

      async.eachSeries(dojos, function(dojo, dojoDone){
        dojopin.load_usersdojos({dojoId: dojo.id}, function(users){
          async.eachSeries(users, function(user, cbUser){
            dojopin.remove_usersdojos({userId: user.id, dojoId: dojo.id}, cbUser);
          }, dojoDone);
        });
      }, cb);
    }
    async.series([
      deleteDojoUsers,
      deleteDojos
    ], done);
  });


  seneca.add({ role: plugin, cmd: 'init'}, function (args, done) {
    seneca.act({ role: plugin, cmd: 'insert', timeout: false, ungate: false}, function(err, response){
      if (err) return done(err);
      console.log('Sending init to next service');
      seneca.act({ role: 'test-event-data', cmd: 'insert', timeout: false, ungate: true});
      done();
    });
  });

  seneca.add({ role: plugin, cmd: 'done'}, function (args, done){
    seneca.act({ role: 'test-user-data', cmd: 'done', timeout: false, ungate: true});
    console.log('Stopping dojo service');
    seneca.close();
    process.exit();
  });

  return {
    name: plugin
  };
};
