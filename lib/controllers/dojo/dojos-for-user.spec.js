var lab = exports.lab = require('lab').script();
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));
var sinon = require('sinon');
var fn = require('./dojos-for-user');

/**
 * cmd_dojos_for_user - Load all dojos for a user
 * @param  {String} id  User id
 * @return {Array}      List of dojos
 */

lab.experiment('dojos-for-user', function () {
  var sandbox = sinon.sandbox.create();
  var listSpy = sandbox.spy();
  var senecaMock = {
   act: sandbox.stub()
  };
  var idMock = '1';
  var cbSpy = sandbox.spy();
  lab.beforeEach(function (done) {
    sandbox.reset();
    senecaMock.act.resetBehavior(); // reset doesn't seem to detach call
    done();
  });
  lab.test('should return a list of dojos for the specified user', function (done) {
    // PREPARE
    var userDojosMock = [{ dojoId: 1 }, { dojoId: 2 }, { dojoId: 3 }];
    var dojosMock = [{ id: 1, name: 'Dojo1', countryName: 'FR'},
      { id: 2, name: 'Dojo2', countryName: 'IE' },
      { id: 3, name: 'Dojo3', countryName: 'IE' }];
    senecaMock.act.withArgs(sinon.match({ role: 'cd-dojos', cmd: 'load_usersdojos'})).callsArgWith(1, null, userDojosMock);
    senecaMock.act.withArgs(sinon.match({ role: 'cd-dojos', ctrl: 'dojo_public_fields', cmd: 'list'})).callsArgWith(1, null, dojosMock);
    // ACT
    fn.apply(senecaMock, [{ role: 'cd-dojos', id: idMock }, cbSpy]);
    expect(senecaMock.act).to.have.been
     .calledWith({ role: 'cd-dojos', cmd: 'load_usersdojos', query: { userId: idMock, deleted: 0 } }, sinon.match.func);
    expect(senecaMock.act).to.have.been
     .calledWith({ role: 'cd-dojos', ctrl: 'dojo_public_fields', cmd: 'list', query: { id: { in$: [1, 2, 3] }, deleted: 0 } }, sinon.match.func);
    expect(senecaMock.act).to.have.been.calledTwice;
    expect(cbSpy).to.have.been.calledOnce;
    expect(cbSpy).to.have.been.calledWith(null, dojosMock);
    done();
  });

  lab.test('should return an error if id is empty', function (done) {
    var err = new Error('Missing parameter query');
    fn.apply(senecaMock, [{ role: 'cd-dojos', id: '' }, cbSpy]);
    expect(senecaMock.act).to.not.have.been.called;
    expect(cbSpy).to.have.been.calledOnce;
    expect(cbSpy).to.have.been.calledWith(err);
    done();
  });

  lab.test('should return an empty array if the user has no dojo', function (done) {
    var userDojosMock = [];
    senecaMock.act.callsArgWith(1, null, userDojosMock);
    // ACT
    fn.apply(senecaMock, [{ role: 'cd-dojos', id: idMock }, cbSpy]);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', cmd: 'load_usersdojos', query: { userId: idMock, deleted: 0 } }, sinon.match.func);
    expect(senecaMock.act).to.have.been.calledOnce;
    expect(cbSpy).to.have.been.calledOnce;
    expect(cbSpy).to.have.been.calledWith(null, userDojosMock);
    done();
  });

  lab.test('should return an error if a µs is unavailable', function (done) {
    var err = new Error('ECONNREFUSED');
    senecaMock.act.callsArgWith(1, err);
    // ACT
    fn.apply(senecaMock, [{ role: 'cd-dojos', id: idMock }, cbSpy]);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', cmd: 'load_usersdojos', query: { userId: idMock, deleted: 0 } }, sinon.match.func);
    expect(senecaMock.act).to.have.been.calledOnce;
    expect(cbSpy).to.have.been.calledOnce;
    expect(cbSpy).to.have.been.calledWith(err);
    done();
  });
});
