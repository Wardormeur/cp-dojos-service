var lab = exports.lab = require('lab').script();
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));
var sinon = require('sinon');
var fn = require('./joined-dojos');

/**
 * Returns a list of dojo for the current user
 * @param  {Object}   query Filters
 * @return {Array}        List of dojos joined
 */

lab.experiment('joined-dojos', function () {
  var sandbox = sinon.sandbox.create();
  var listSpy = sandbox.spy();
  var senecaMock = {
   act: null
  };
  var queryMock = {};
  var userMock = { id: 42 };
  var cbSpy = sandbox.spy();
  var clock;
  lab.beforeEach(function (done) {
    clock = sinon.useFakeTimers();
    sandbox.reset();
    senecaMock.act = sandbox.stub();
    done();
  });
  lab.afterEach(function (done) {
    clock.restore();
    senecaMock.act.resetBehavior(); // reset doesn't seem to detach call
    done();
  })
  lab.test('should return a list of dojos for the current user without filters', function (done) {
    // PREPARE
    var userDojosMock = [{ dojoId: 1 }, { dojoId: 2 }, { dojoId: 3 }];
    var dojosMock = [{ id: 1, name: 'Dojo1', countryName: 'FR'},
      { id: 2, name: 'Dojo2', countryName: 'IE' },
      { id: 3, name: 'Dojo3', countryName: 'IE' }];
    var expectedResult = { total: dojosMock.length, records: dojosMock };
    senecaMock.act.withArgs(sinon.match({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list'}))
      .callsArgWith(1, null, userDojosMock);
    senecaMock.act.withArgs(sinon.match({ role: 'cd-dojos', ctrl: 'dojo_public_fields', cmd: 'list'}))
      .callsArgWith(1, null, dojosMock);
    // ACT
    fn.apply(senecaMock, [{ role: 'cd-dojos', user: userMock }, cbSpy]);
    clock.tick(1000);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list', query: { userId: userMock.id , deleted: 0, 'limit$': 'NULL' } }, sinon.match.func);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', ctrl: 'dojo_public_fields', cmd: 'list', query: { and$: [{ id: { in$: [1, 2, 3] } }] }  }, sinon.match.func);
    expect(senecaMock.act).to.have.been.calledTwice;
    expect(cbSpy).to.have.been.calledOnce;
    expect(cbSpy).to.have.been.calledWith(null, expectedResult);
    done();
  });

  lab.test('should return a list of dojos for the current user with filters', function (done) {
    // PREPARE
    var userDojosMock = [{ dojoId: 1 }, { dojoId: 2 }, { dojoId: 3 }];
    var dojosMock = [{ id: 1, name: 'Dojo1', countryName: 'FR'},
      { id: 2, name: 'Dojo2', countryName: 'IE' },
      { id: 3, name: 'Dojo3', countryName: 'IE' }];
    var queryMock = { verified: 1, stage: { ne$: 4 }, sort$: 'createdAt' };
    var expectedResult = { total: dojosMock.length, records: dojosMock };
    senecaMock.act.withArgs(sinon.match({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list'}))
      .callsArgWith(1, null, userDojosMock);
    senecaMock.act.withArgs(sinon.match({ role: 'cd-dojos', ctrl: 'dojo_public_fields', cmd: 'list'}))
      .callsArgWith(1, null, dojosMock);
    // ACT
    fn.apply(senecaMock, [{ role: 'cd-dojos', user: userMock, query: queryMock }, cbSpy]);
    clock.tick(1000);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list',
        query: { userId: userMock.id , deleted: 0, 'limit$': 'NULL' } }, sinon.match.func);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', ctrl: 'dojo_public_fields', cmd: 'list',
        query: { and$: [{ verified: 1, stage: { ne$: 4 } }, { id: { in$: [1, 2, 3] } }], sort$: 'createdAt' }  }, sinon.match.func);
    expect(senecaMock.act).to.have.been.calledTwice;
    expect(cbSpy).to.have.been.calledOnce;
    expect(cbSpy).to.have.been.calledWith(null, expectedResult);
    done();
  });

  lab.test('should return an empty object if the user isnt a member of a dojo', function (done) {
    // PREPARE
    var userDojosMock = [];
    var expectedResult = { total: 0, records: [] };
    senecaMock.act.withArgs(sinon.match({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list'}))
      .callsArgWith(1, null, userDojosMock);
    // ACT
    fn.apply(senecaMock, [{ role: 'cd-dojos', user: userMock, query: {} }, cbSpy]);
    clock.tick(1000);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list', query: { userId: userMock.id , deleted: 0, 'limit$': 'NULL' } }, sinon.match.func);
    expect(senecaMock.act).to.have.been.calledOnce;
    expect(cbSpy).to.have.been.calledOnce;
    expect(cbSpy).to.have.been.calledWith(null, expectedResult);
    done();
  });
  lab.test('should return an empty object if the user isnt a member of a dojo', function (done) {
    // PREPARE
    var errorMock = new Error('ECONNREFUSED');
    var userDojosMock = [];
    var expectedResult = { total: 0, records: [] };
    senecaMock.act.withArgs(sinon.match({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list'}))
      .callsArgWith(1, errorMock);
    // ACT
    fn.apply(senecaMock, [{ role: 'cd-dojos', user: userMock, query: {} }, cbSpy]);
    clock.tick(1000);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list', query: { userId: userMock.id , deleted: 0, 'limit$': 'NULL' } }, sinon.match.func);
    expect(senecaMock.act).to.have.been.calledOnce;
    expect(cbSpy).to.have.been.calledOnce;
    expect(cbSpy).to.have.been.calledWith(errorMock);
    done();
  });
});
