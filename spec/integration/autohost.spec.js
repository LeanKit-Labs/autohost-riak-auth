var should = require( 'should' );
var request = require( 'request' ).defaults( { jar: false } );
var when = require( 'when' );
var sequence = require( 'when/sequence' );
var fs = require( 'fs' );
var path = require( 'path' );
var riak = require( 'riaktive' );

describe( 'Autohost Integration', function() {
	var host;
	var auth;

	before( function( done ) {
		this.timeout( 30000 );
		host = require( 'autohost' );
		auth = require( '../../src/index.js' )( {
			appName: 'ah-riak-integration',
			riak: { nodes:
				[
					{ host: 'localhost' }
				] }
		} );
		auth.reset()
			.then( function() {
				host.init( {
					port: 88981,
					resources: './spec/integration/resources'
				}, auth );
				setTimeout( function() {
					auth.changeActionRoles( 'test.hi', [ 'user' ], 'add' );
					done();
				}, 200 );
			} );
	} );

	describe( 'with no users', function() {
		describe( 'when checking for users', function() {
			var hasUsers;
			before( function( done ) {
				auth.hasUsers()
					.then( function( users ) {
						hasUsers = users;
						done();
					} );
			} );

			it( 'should not find users', function() {
				should( hasUsers ).be.undefined; // jshint ignore:line
			} );

		} );

		describe( 'when requesting access to an action with no role restriction', function() {
			var response;
			before( function( done ) {
				host.passport.resetUserCheck();
				request.get( {
					url: 'http://localhost:88981/api/test/anon'
				}, function( err, resp ) {
						response = {
							body: resp.body,
							status: resp.statusCode
						};
						done();
					} );
			} );

			it( 'should respond with 203', function() {
				response.status.should.equal( 203 );
			} );

			it( 'should process request successfully', function() {
				response.body.should.equal( 'who are you?' );
			} );
		} );

		describe( 'when requesting access to an action with role restrictions', function() {
			var response;
			before( function( done ) {
				request.get( {
					url: 'http://localhost:88981/api/test/hi'
				}, function( err, resp ) {
						response = {
							body: resp.body,
							status: resp.statusCode
						};
						done();
					} );
			} );

			it( 'should respond with 403', function() {
				response.status.should.equal( 403 );
			} );

			it( 'should reject request with inadquate permissions', function() {
				response.body.should.equal( 'User lacks sufficient permissions' );
			} );
		} );
	} );

	describe( 'with users', function() {

		before( function( done ) {
			this.timeout( 10000 );
			sequence( [ function() {
					return auth.createUser( 'user1', 'test' );
				}, function() {
					return auth.createUser( 'user2', 'test' );
				}, function() {
					return auth.changeUserRoles( 'user1', [ 'user' ], 'add' );
				}, function() {
					return auth.createToken( 'user1', 'token' );
				}
			] ).then( function() {
				host.passport.resetUserCheck();
				done();
			}, function( err ) {
					console.log( ':(', err.stack );
				} );
		} );

		describe( 'with invalid credentials', function() {
			var response;
			before( function( done ) {
				request.get( {
					url: 'http://localhost:88981/api/test/hi',
					headers: {
						// authorization: 'Basic dXNlcjE6dGVzdA=='
						authorization: 'Basic dXNlcjE6dGVzdDE='
					}
				}, function( err, resp ) {
						response = {
							body: resp.body,
							status: resp.statusCode
						};
						done();
					} );
			} );

			it( 'should respond with 401', function() {
				response.status.should.equal( 401 );
			} );

			it( 'should reject request with bad credentials', function() {
				response.body.should.equal( 'Unauthorized' );
			} );
		} );

		describe( 'when requesting access to an action with adequate permissions and credentials', function() {
			var response;
			before( function( done ) {
				request.get( {
					url: 'http://localhost:88981/api/test/hi',
					headers: {
						authorization: 'Basic dXNlcjE6dGVzdA=='
					}
				}, function( err, resp ) {
						response = {
							body: resp.body,
							status: resp.statusCode
						};
						done();
					} );
			} );

			it( 'should respond with 200', function() {
				response.status.should.equal( 200 );
			} );
			it( 'should process request successfully', function() {
				response.body.should.equal( 'hello, user1!' );
			} );
		} );

		describe( 'when requesting access to an action with adequate permissions and token', function() {
			var response;
			before( function( done ) {
				request.get( {
					url: 'http://localhost:88981/api/test/hi',
					headers: {
						authorization: 'Bearer token'
					}
				}, function( err, resp ) {
						response = {
							body: resp.body,
							status: resp.statusCode
						};
						done();
					} );
			} );

			it( 'should respond with 200', function() {
				response.status.should.equal( 200 );
			} );
			it( 'should process request successfully', function() {
				response.body.should.equal( 'hello, user1!' );
			} );
		} );
	} );

	after( function() {
		host.stop();
	} );
} );
