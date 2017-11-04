var lab = exports.lab = require('lab').script();
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));
var sinon = require('sinon');
var _ = require('lodash');
var fn = require('./submit');

lab.describe('dojo - submit', function () {
  var sandbox = sinon.sandbox.create();
  var senecaMock = {
    act: sandbox.stub(),
    options: sandbox.stub().returns({env: {
      hostname: 'cd.com',
      protocol: 'https'
    },
    shared: {
      botEmail: 'info@cd.com'
    }})
  };
  var cbSpy = sandbox.spy();

  var dojoMock = { id: 1 };
  var fullDojoMock = { id: 1, name: 'dojo1', email: 'dojo@do.joe', creator: 42,
    creatorEmail: 'user1@gg.com', urlSlug: 'fr/lyon', dojoLeadId: 99 };
  var userMock = { id: 42, name: 'iamuser', roles: ['basic-user'] };
  var clock;
  var mockPayload = {
    id: 1,
    created: sinon.match.date,
    verified: 0,
    deleted: 0
  };
  var existingUserDojosMock = [{ userId: 42, dojoId: 1 }];
  var newUserDojosMock = [];
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
  });
  lab.test('the dojo should be forced to unverified, undeleted at submission', function (done) {
    senecaMock.act
      .withArgs(sinon.match({ role: 'cd-dojos', entity: 'dojo', cmd: 'save' }))
      .callsArgWith(1, null, dojoMock);

    // ACT
    fn.apply(senecaMock, [{ dojo: dojoMock, user: userMock }, cbSpy]);
    clock.tick(1000);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'dojo', cmd: 'save', dojo: mockPayload }, sinon.match.func)
    expect(senecaMock.act).to.have.been.called;
    done();
  });

  lab.test('should save a new user/dojo relationship', function (done) {
    var newUserDojoPayload = {
      owner: 1,
      userTypes: ['champion'],
      userPermissions: [{ title: 'Dojo Admin', name: 'dojo-admin' },
        { title: 'Ticketing Admin', name: 'ticketing-admin' }],
      deleted: 0,
      // NOTE : this allows us to submit as CDF for the user
      // If we were to use the user, the relationship would use CDF instead of the dojo creator
      userId: fullDojoMock.creator,
      dojoId: fullDojoMock.id
    };
    senecaMock.act
      .withArgs(sinon.match({ role: 'cd-dojos', entity: 'dojo', cmd: 'save' }))
      .callsArgWith(1, null, dojoMock);
    senecaMock.act
      .withArgs(sinon.match({ role: 'cd-dojos', entity: 'dojo', cmd: 'load' }))
      .callsArgWith(1, null, fullDojoMock);
    senecaMock.act
      .withArgs(sinon.match({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list' }))
      .callsArgWith(1, null, newUserDojosMock);
    senecaMock.act
      .withArgs(sinon.match({ role: 'cd-dojos', entity: 'userdojo', cmd: 'save' }))
      .callsArgWith(1, null, newUserDojosMock);

    // ACT
    fn.apply(senecaMock, [{ dojo: dojoMock, user: userMock }, cbSpy]);
    clock.tick(1000);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'dojo', cmd: 'save', dojo: mockPayload }, sinon.match.func);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'dojo', cmd: 'load', id: dojoMock.id }, sinon.match.func);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list', query: { userId: userMock.id, dojoId: dojoMock.id } }, sinon.match.func);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'userdojo', cmd: 'save', userdojo: newUserDojoPayload }, sinon.match.func);
    done();
  });

  lab.test('should not save an existing user/dojo relationship', function (done) {
    senecaMock.act
      .withArgs(sinon.match({ role: 'cd-dojos', entity: 'dojo', cmd: 'save' }))
      .callsArgWith(1, null, dojoMock);
    senecaMock.act
      .withArgs(sinon.match({ role: 'cd-dojos', entity: 'dojo', cmd: 'load' }))
      .callsArgWith(1, null, fullDojoMock);
    senecaMock.act
      .withArgs(sinon.match({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list' }))
      .callsArgWith(1, null, existingUserDojosMock);

    // ACT
    fn.apply(senecaMock, [{ dojo: dojoMock, user: userMock }, cbSpy]);
    clock.tick(1000);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'dojo', cmd: 'save', dojo: mockPayload }, sinon.match.func);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'dojo', cmd: 'load', id: dojoMock.id }, sinon.match.func);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list', query: { userId: userMock.id, dojoId: dojoMock.id } }, sinon.match.func);
    expect(senecaMock.act.withArgs(sinon.match({ role: 'cd-dojos', entity: 'userdojo', cmd: 'save' })))
      .to.not.have.been.called;
    done();
  });

  lab.test('should not notify the creator if the user is CDF', function (done) {
    var cdfUserMock = _.clone(userMock);
    cdfUserMock.roles = ['cdf-admin'];
    cdfUserMock.id = 9000;
    senecaMock.act
      .withArgs(sinon.match({ role: 'cd-dojos', entity: 'dojo', cmd: 'save' }))
      .callsArgWith(1, null, dojoMock);
    senecaMock.act
      .withArgs(sinon.match({ role: 'cd-dojos', entity: 'dojo', cmd: 'load' }))
      .callsArgWith(1, null, fullDojoMock);
    senecaMock.act
      .withArgs(sinon.match({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list' }))
      .callsArgWith(1, null, existingUserDojosMock);

    // ACT
    fn.apply(senecaMock, [{ dojo: dojoMock, user: cdfUserMock }, cbSpy]);
    clock.tick(1000);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'dojo', cmd: 'save', dojo: mockPayload }, sinon.match.func);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'dojo', cmd: 'load', id: dojoMock.id }, sinon.match.func);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list', query: { userId: fullDojoMock.creator, dojoId: dojoMock.id } }, sinon.match.func);
    expect(senecaMock.act.withArgs(sinon.match({ role: 'cd-dojos', entity: 'userdojo', cmd: 'save' })))
      .to.not.have.been.called;
    expect(senecaMock.act.withArgs(sinon.match({ role: 'cd-dojos', ctrl: 'notifications', channel: 'email', cmd: 'send' })))
      .to.not.have.been.called;
    expect(cbSpy).to.have.been.calledWith(null, fullDojoMock);
    done();
  });
  
  lab.test('should notify the creator', function (done) {
    var contentMock = {
      dojoName: fullDojoMock.name,
      dojoLeadName: userMock.name,
      dojoEmail: fullDojoMock.email,
      dojoLink: 'https://cd.com/dashboard/dojo/fr/lyon',
      applicationLink: 'https://cd.com/dashboard/lead/99'
    };
    var mailPayload = { to: 'info@cd.com', code: 'new-dojo-', locality: 'en_US',
      content: contentMock, from: 'info@cd.com', replyTo: fullDojoMock.creatorEmail,
      subject: 'A new Dojo has been created' };
    senecaMock.act
      .withArgs(sinon.match({ role: 'cd-dojos', entity: 'dojo', cmd: 'save' }))
      .callsArgWith(1, null, dojoMock);
    senecaMock.act
      .withArgs(sinon.match({ role: 'cd-dojos', entity: 'dojo', cmd: 'load' }))
      .callsArgWith(1, null, fullDojoMock);
    senecaMock.act
      .withArgs(sinon.match({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list' }))
      .callsArgWith(1, null, existingUserDojosMock);
    senecaMock.act
      .withArgs(sinon.match({ role: 'cd-dojos', ctrl: 'notifications', channel: 'email', cmd: 'send' }))
      .callsArgWith(1, null, fullDojoMock);

    // ACT
    fn.apply(senecaMock, [{ dojo: dojoMock, user: userMock }, cbSpy]);
    clock.tick(1000);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'dojo', cmd: 'save', dojo: mockPayload }, sinon.match.func);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'dojo', cmd: 'load', id: dojoMock.id }, sinon.match.func);
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', entity: 'userdojo', cmd: 'list', query: { userId: fullDojoMock.creator, dojoId: dojoMock.id } }, sinon.match.func);
    expect(senecaMock.act.withArgs(sinon.match({ role: 'cd-dojos', entity: 'userdojo', cmd: 'save' })))
      .to.not.have.been.called;
    expect(senecaMock.act).to.have.been
      .calledWith({ role: 'cd-dojos', ctrl: 'notifications', channel: 'email', cmd: 'send', payload: mailPayload }, sinon.match.func);
    expect(cbSpy).to.have.been.calledWith(null, fullDojoMock);
    done();
  });
});
