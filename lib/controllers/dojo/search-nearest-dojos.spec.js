var lab = exports.lab = require('lab').script();
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));
var sinon = require('sinon');
var proxy = require('proxyquire');
var fn;

/**
 * cmd_search_nearest_dojos - Search for a dojo corresponding to a name,
 *  ordered by distance from passed location
 *
 * @param  {Number} lat latitude of the reference
 * @param  {Number} lon longitude of the reference
 * @param  {String} search name
 * @return {Array}      Dojos distances to the reference
 */
 lab.experiment('search-nearest-dojos', function () {
   var sandbox;
   var senecaMock = {
     options: function() {
       return {
        'postgresql-store' : {
          name: 'dbname',
          username: 'dbuser'
        }
       };
     }
   };
   var sandbox = sinon.sandbox.create();
   var pgMock = {
     connect: sandbox.stub(),
   };
   var purgeEBFields = sandbox.spy();
   var purgeInviteEmails = sandbox.spy();
   var clientSpy = {
     query: sandbox.stub(),
     end: sandbox.stub()
   };
   var cbSpy = sandbox.spy();
   lab.before(function (done) {
     fn = proxy('./search-nearest-dojos.js', {
       'pg': pgMock,
       './../../utils/dojo/purgeEBFields': purgeEBFields,
       './../../utils/dojo/purgeInviteEmails': purgeInviteEmails
     });
     done();
   });
   lab.beforeEach(function (done) {
     sandbox.reset();
     done();
   });
   lab.test('should not look for dojos if no search is passed down', function (done) {
     fn.apply(senecaMock, [{ query: { lat: 1, lon: 2 } }, cbSpy]);
     expect(pgMock.connect).to.not.have.been.calledOnce;
     expect(clientSpy.query).to.not.have.been.called;
     expect(cbSpy).to.have.been.calledOnce;
     expect(cbSpy).to.have.been.calledWith(null, []);
     done();
   });
   lab.test('should look for dojos by lat/lon and by name', function (done) {
     fn.apply(senecaMock, [{ query: { lat: 1, lon: 2, search: 'do-joe' } }, cbSpy]);
     expect(pgMock.connect).to.have.been.calledOnce;
     expect(pgMock.connect).to.have.been
       .calledWith({ database: 'dbname', user: 'dbuser', name: 'dbname', username: 'dbuser' });
     pgMock.connect.callArgWith(1, null, clientSpy);
     expect(clientSpy.query).to.have.been.calledOnce;
     expect(clientSpy.query).to.have.been
      .calledWith('SELECT *, earth_distance(ll_to_earth($1, $2), ll_to_earth((geo_point->\'lat\')::text::float8, (geo_point->\'lon\')::text::float8)) AS distance_from_search_location FROM v_dojos_public_fields WHERE stage != 4 AND verified != 0 AND deleted != 1 OR name ILIKE $3 ORDER BY distance_from_search_location ASC LIMIT 10',
      [1, 2, '%do-joe%'],
      sinon.match.func
     );
     clientSpy.query.callArgWith(2, null, { rows: [] });
     expect(clientSpy.end).to.have.been.calledOnce;
     expect(cbSpy).to.have.been.calledOnce;
     done();
   });
  //  lab.test('should not clean up the private dojos fields when there is no results', function (done) {
  //    fn.apply(senecaMock, [{ query: { lat: 1, lon: 2, search: 'do-joe' } }, cbSpy]);
  //    expect(pgMock.connect).to.have.been.calledOnce;
  //    expect(pgMock.connect).to.have.been
  //      .calledWith({ database: 'dbname', user: 'dbuser', name: 'dbname', username: 'dbuser' });
  //    pgMock.connect.callArgWith(1, null, clientSpy);
  //    expect(clientSpy.query).to.have.been.calledOnce;
  //    expect(clientSpy.query).to.have.been
  //     .calledWith('SELECT *, earth_distance(ll_to_earth($1, $2), ll_to_earth((geo_point->\'lat\')::text::float8, (geo_point->\'lon\')::text::float8)) AS distance_from_search_location FROM v_dojos_public_fields WHERE stage != 4 AND verified != 0 AND deleted != 1 OR name ILIKE $3 ORDER BY distance_from_search_location ASC LIMIT 10',
  //     [1, 2, '%do-joe%'],
  //     sinon.match.func
  //    );
  //    clientSpy.query.callArgWith(2, null, { rows: [] });
  //    expect(purgeEBFields).to.not.have.been.called;
  //    expect(purgeInviteEmails).to.not.have.been.called;
  //    expect(clientSpy.end).to.have.been.calledOnce;
  //    expect(cbSpy).to.have.been.calledOnce;
  //    expect(cbSpy).to.have.been.calledWith(null, []);
  //    done();
  //  });
  //  lab.test('should clean up the private dojos fields when there are results', function (done) {
  //    var dojosMock = { rows: [{}, {}] };
  //    fn.apply(senecaMock, [{ query: { lat: 1, lon: 2, search: 'do-joe' } }, cbSpy]);
  //    expect(pgMock.connect).to.have.been.calledOnce;
  //    expect(pgMock.connect).to.have.been
  //      .calledWith({ database: 'dbname', user: 'dbuser', name: 'dbname', username: 'dbuser' });
  //    pgMock.connect.callArgWith(1, null, clientSpy);
  //    expect(clientSpy.query).to.have.been.calledOnce;
  //    expect(clientSpy.query).to.have.been
  //     .calledWith('SELECT *, earth_distance(ll_to_earth($1, $2), ll_to_earth((geo_point->\'lat\')::text::float8, (geo_point->\'lon\')::text::float8)) AS distance_from_search_location FROM v_dojos_public_fields WHERE stage != 4 AND verified != 0 AND deleted != 1 OR name ILIKE $3 ORDER BY distance_from_search_location ASC LIMIT 10',
  //     [1, 2, '%do-joe%'],
  //     sinon.match.func
  //    );
  //    clientSpy.query.callArgWith(2, null, dojosMock);
  //    expect(purgeEBFields).to.have.been.calledTwice;
  //    expect(purgeInviteEmails).to.have.been.calledTwice;
  //    expect(clientSpy.end).to.have.been.calledOnce;
  //    expect(cbSpy).to.have.been.calledOnce;
  //    expect(cbSpy).to.have.been.calledWith(null, dojosMock.rows);
  //    done();
  //  });
});
