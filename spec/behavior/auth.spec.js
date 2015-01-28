require( 'should' );
var _ = require( 'lodash' );
var when = require( 'when' );
var seq = require( 'when/sequence' );
var pipe = require( 'when/pipeline' );
var api = require( '../../src/index.js' )( { appName: 'spec', riak: { host: 'localhost' } } );

describe( 'Authentication / Authorization', function() {

	describe( 'when authenticating invalid credentials', function() {
		var result;

		before( function( done ) {
			api.verifyCredentials( 'terd', 'ferguson' )
				.then( null, function( err ) {
					console.log( 'FAIL', err );
				} )
				.then( function( valid ) {
					result = valid;
					done();
				} );
		} );

		it( 'should reject', function() {
			result.should.be.false; // jshint ignore:line
		} );
	} );

	describe( 'when authenticating valid account', function() {
		var correct, incorrect;

		before( function( done ) {
			seq( [ function() {
					return api.createUser( 'ron.burgundy@newsteam.com', 'huginn munin' );
				}, function() {
					return api.verifyCredentials( 'ron.burgundy@newsteam.com', 'huginn munin' );
				}, function() {
					return api.verifyCredentials( 'ron.burgundy@newsteam.com', 'foggy london town' );
				}
			] )
				.then( null, function( err ) {
					console.log( 'FAIL', err.stack );
				} )
				.then( function( results ) {
					correct = results[ 1 ];
					incorrect = results[ 2 ];
					done();
				} );
		} );

		it( 'should reject incorrect password', function() {
			incorrect.should.be.false; // jshint ignore:line
		} );

		it( 'should accept correct password', function() {
			correct.name.should.equal( 'ron.burgundy@newsteam.com' );
		} );
	} );

	describe( 'when authorizing an account', function() {
		before( function( done ) {
			seq( [ function() {
					return api.updateActions( {
						'test': [ 'add', 'update', 'delete', 'view' ]
					} );
				}, function() {
					return api.changeActionRoles( 'add', [ 'privileged', 'super' ], 'add' );
				}, function() {
					return api.changeActionRoles( 'update', [ 'privileged', 'super' ], 'add' );
				}, function() {
					return api.changeActionRoles( 'delete', [ 'super' ], 'add' );
				}, function() {
					return api.changeActionRoles( 'view', [ 'any', 'privileged', 'super' ], 'add' );
				}, function() {
					return api.createUser( 'user@app.com', 'password' );
				}, function() {
					return api.changeUserRoles( 'user@app.com', [ 'any' ], 'add' );
				}, function() {
					return api.createUser( 'admin@app.com', 'password' );
				}, function() {
					return api.changeUserRoles( 'admin@app.com', [ 'super' ], 'add' );
				}
			] )
				.then( null, function( err ) {
					console.log( 'FAIL', err.stack );
				} )
				.then( function() {
					done();
				} );
		} );

		it( 'should authorize user for view', function( done ) {
			api.checkPermission( 'user@app.com', 'view' )
				.then( function( pass ) {
					pass.should.be.true; // jshint ignore:line
					done();
				} );
		} );

		it( 'should authorize based on cached objects', function( done ) {
			api.checkPermission(
				{ roles: [ 'one', 'two', 'three' ] },
				{ roles: [ 'two' ] } )
				.then( function( pass ) {
					pass.should.be.true; // jshint ignore:line
					done();
				} );
		} );

		it( 'should reject based on cached objects', function( done ) {
			api.checkPermission(
				{ roles: [ 'one', 'two', 'three' ] },
				{ roles: [ 'four' ] } )
				.then( function( pass ) {
					pass.should.be.false; // jshint ignore:line
					done();
				} );
		} );

		it( 'should reject based on cached disabled account', function( done ) {
			api.checkPermission(
				{ roles: [ 'one', 'two', 'three' ], disabled: true },
				{ roles: [ 'one' ] }
			).then( function( pass ) {
				pass.should.be.false; // jshint ignore:line
				done();
			} );
		} );

		it( 'should reject based on disabled account', function( done ) {
			api.disableUser( 'user@app.com' )
				.then( null, function( err ) {
					( err == null ).should.be.true; // jshint ignore:line
					done();
				} )
				.then( function() {
					api.checkPermission( { name: 'user@app.com' }, 'view' )
						.then( function( pass ) {
							pass.should.be.false; // jshint ignore:line
							done();
						} );
				} );
		} );

		it( 'should accept based on re-enabled account', function( done ) {
			api.enableUser( 'user@app.com' )
				.then( null, function( err ) {
					( err == null ).should.be.true; // jshint ignore:line
					done();
				} )
				.then( function() {
					api.checkPermission( 'user@app.com', 'view' )
						.then( function( pass ) {
							pass.should.be.true; // jshint ignore:line
							done();
						} );
				} );
		} );

		after( function( done ) {
			seq( [ function() {
					return api.deleteUser( 'ron.burgundy@newsteam.com' );
				}, function() {
					return api.deleteUser( 'user@app.com' );
				}, function() {
					return api.deleteUser( 'admin@app.com' );
				}, function() {
					return api.deleteAction( 'add' );
				}, function() {
					return api.deleteAction( 'delete' );
				}, function() {
					return api.deleteAction( 'update' );
				}, function() {
					return api.deleteAction( 'view' );
				}
			] )
				.then( function() {
					done();
				} );
		} );
	} );
} );
