var lab = exports.lab = require('lab').script();
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));
var sinon = require('sinon');
var fn = require('./dojos-by-country');

/**
 * cmd_dojos_by_country - List of dojos grouped by countries, ordered by alpha2
 *
 * @param  {Object} query
 * @return {Object}      a list of dojo per key; a key per country
 */

lab.experiment('dojos-by-continent', function () {
  var sandbox = sinon.sandbox.create();
  var listSpy = sandbox.spy();
  var senecaMock = {
   act: sandbox.stub()
  };
  var queryMock = { limit$ : 'NULL' };
  var cbSpy = sandbox.spy();
  lab.beforeEach(function (done) {
   sandbox.reset();
   done();
  });
  lab.test('should return an aggregated list of dojos', function (done) {
   var dojosMock = [{ id: 1, name: 'Dojo1', countryName: 'FR'},
    { id: 2, name: 'Dojo2', countryName: 'IE' },
    { id: 3, name: 'Dojo3', countryName: 'IE' }];
   var expectedResult = { 'FR': [
     { id: 1, countryName: 'FR', name: 'Dojo1' }],
     'IE': [{ id: 2, name: 'Dojo2', countryName: 'IE' },
      { id: 3, name: 'Dojo3', countryName: 'IE' }] };
   fn.apply(senecaMock, [{ role: 'cd-dojos', query: queryMock }, cbSpy]);
   expect(senecaMock.act).to.have.been.calledOnce;
   expect(senecaMock.act).to.have.been
     .calledWith({ role: 'cd-dojos', ctrl: 'dojo_public_fields', cmd: 'list', query: queryMock }, sinon.match.func);
   senecaMock.act.callArgWith(1, null, dojosMock);
   expect(cbSpy).to.have.been.calledOnce;
   expect(cbSpy).to.have.been.calledWith(null, expectedResult);
   done();
  });
  lab.test('should sort the aggregated list of dojos by name', function (done) {
    var dojosMock = [{ id: 3, name: 'Dojo3', countryName: 'IE' },
     { id: 1, name: 'Dojo1', countryName: 'FR'},
     { id: 2, name: 'Dojo2', countryName: 'IE' },
     { id: 10, name: 'A', countryName: 'IE' }];
    var expectedResult = { 'FR': [
      { id: 1, countryName: 'FR', name: 'Dojo1' }],
      'IE': [{ id: 10, name: 'A', countryName: 'IE' },
       { id: 2, name: 'Dojo2', countryName: 'IE' },
       { id: 3, name: 'Dojo3', countryName: 'IE' }] };
    fn.apply(senecaMock, [{ role: 'cd-dojos', query: queryMock }, cbSpy]);
    expect(senecaMock.act).to.have.been.calledOnce;
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', ctrl: 'dojo_public_fields', cmd: 'list', query: queryMock }, sinon.match.func);
    senecaMock.act.callArgWith(1, null, dojosMock);
    expect(cbSpy).to.have.been.calledOnce;
    expect(cbSpy).to.have.been.calledWith(null, expectedResult);
    expect(cbSpy.getCall(0).args[1]['IE']).to.be
      .deep.equal([{ id: 10, name: 'A', countryName: 'IE' },
       { id: 2, name: 'Dojo2', countryName: 'IE' },
       { id: 3, name: 'Dojo3', countryName: 'IE' }]);
    done();
  });
  lab.test('should return an error if query is empty', function (done) {
    var err = new Error('Missing parameter query');
    fn.apply(senecaMock, [{ role: 'cd-dojos' }, cbSpy]);
    expect(senecaMock.act).to.not.have.been.called;
    expect(cbSpy).to.have.been.calledOnce;
    expect(cbSpy).to.have.been.calledWith(err);
    done();
  });
  lab.test('should return an error if the db is unavailable', function (done) {
    var err = new Error('ECONNREFUSED');
    fn.apply(senecaMock, [{ role: 'cd-dojos', query: queryMock }, cbSpy]);
    expect(senecaMock.act).to.have.been.calledOnce;
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', ctrl: 'dojo_public_fields', cmd: 'list', query: queryMock }, sinon.match.func);
    senecaMock.act.callArgWith(1, err, null);
    expect(cbSpy).to.have.been.calledOnce;
    expect(cbSpy).to.have.been.calledWith(err);
    done();
  });
});
