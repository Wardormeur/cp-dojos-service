var lab = exports.lab = require('lab').script();
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));
var sinon = require('sinon');
var fn = require('./dojos-by-continent');

/**
 * cmd_get_stats - query cd_stats for all stats
 *
 * @return {Object}      Aggregation of dojos number per continent
 */
 lab.experiment('dojos-by-continent', function () {
   var sandbox = sinon.sandbox.create();
   var listSpy = sandbox.spy();
   var senecaMock = {
     make$: sandbox.stub().returns({
       list$: listSpy
     })
   };
   var cbSpy = sandbox.spy();
   lab.beforeEach(function (done) {
     sandbox.reset();
     done();
   });
   lab.test('should return an aggregated list of dojos', function (done) {
     var statsMock = [{ country: 'FR', continent: 'EU', number: 5 },
      { country: 'IE', continent: 'EU', number: 9000 },
      { continent: 'WA', number: 10 }];
     var expectedResult = { 'EU': [
       { country: 'FR', continent: 'EU', number: 5 }, { country: 'IE', continent: 'EU', number: 9000 }
      ], 'WA': [ { continent: 'WA', number: 10 } ] };
     fn.apply(senecaMock, [{ role: 'cd-dojos' }, cbSpy]);
     expect(senecaMock.make$).to.have.been.calledOnce;
     expect(senecaMock.make$).to.have.been.calledWith('cd/stats');
     expect(listSpy).to.have.been.calledOnce;
     expect(listSpy).to.have.been.calledWith({ limit$: 'NULL' }, sinon.match.func);
     listSpy.callArgWith(1, null, statsMock);
     expect(cbSpy).to.have.been.calledOnce;
     expect(cbSpy).to.have.been.calledWith(null, expectedResult);
     done();
   });
   lab.test('should return an error if the db is unavailable', function (done) {
     var err = new Error('ECONNREFUSED')
     fn.apply(senecaMock, [{ role: 'cd-dojos' }, cbSpy]);
     expect(senecaMock.make$).to.have.been.calledOnce;
     expect(senecaMock.make$).to.have.been.calledWith('cd/stats');
     expect(listSpy).to.have.been.calledOnce;
     expect(listSpy).to.have.been.calledWith({ limit$: 'NULL' }, sinon.match.func);
     listSpy.callArgWith(1, err, null);
     expect(cbSpy).to.have.been.calledOnce;
     expect(cbSpy).to.have.been.calledWith(err);
     done();
   });
});
