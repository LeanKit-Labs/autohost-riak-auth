var _ = require( 'lodash' ),
	should = require( 'should' ),
	when = require( 'when' ),
	seq = require( 'when/sequence' ),
	pipe = require( 'when/pipeline' ),
	users = require( '../src/store/users.js' )( { appName: 'spec', riak: { host: 'ubuntu' } } );

describe( 'when creating', function() {

	before( function( done ) {
		when.all( [
			users.create( 'userone', 'two', 'three' ),
			users.create( 'usertwo', 'two', 'three' ),
			users.create( 'userthree', 'two', 'three' ),
			users.create( 'userfour', 'two', 'three' ),
			users.create( 'userfive', 'two', 'three' ),
			users.create( 'usersix', 'two', 'three' ),
			users.create( 'userseven', 'two', 'three' ),
			users.create( 'usereight', 'two', 'three' ),
			users.create( 'usernine', 'two', 'three' ),
			] )
			.then( null, function( err ) {
				console.log( err.stack );
			} )
			.then( function() {
				done();
			} );
	} );

	it( 'should create user', function( done ) {
		users.getByName( 'userone' )
			.then( function( user ) {
				user.name.should.equal( 'userone' );
				user.salt.should.equal( 'two' );
				user.hash.should.equal( 'three' );
				user.roles.should.eql( [] );
				user.tokens.should.eql( [] );
				should( user.disabled ).should.not.exist; // jshint ignore:line
				done();
			} );
	} );

	describe( 'when changing password', function() {
		var user;

		before( function( done ) {
			seq( [
				function() { return users.changePassword( 'userone', 'four', 'five' ); },
				function() { return users.getByName( 'userone' ); }
				] )
			.then( null, function( err ) {
				console.log( err.stack );
			} )
			.then( function( x ) {
				user = x[ 1 ];
				done();
			} );
		} );

		it( 'should change password', function() {
			user.name.should.equal( 'userone' );
			user.salt.should.equal( 'four' );
			user.hash.should.equal( 'five' );
		} );

	} );

	describe( 'when creating tokens', function() {
		var tokens, user;

		before( function( done ) {
			seq( [
				function() { return users.createToken( 'userone', 'six' ); },
				function() { return users.createToken( 'userone', 'seven' ); },
				function() { return users.createToken( 'userone', 'eight' ); },
				function() { return users.getTokens( 'userone' ); },
				function() { return users.getByName( 'userone' ); }
				] )
			.then( null, function( err ) {
				console.log( err.stack );
			} )
			.then( function( x ) {
				tokens = x[ 3 ];
				user = x[ 4 ];
				done();
			} );
		} );

		it( 'should add a token', function() {
			user.name.should.equal( 'userone' );
			user.tokens.should.eql( [ 'six', 'seven', 'eight' ] );
			tokens.should.eql( [ 'six', 'seven', 'eight' ] );
		} );

	} );

	describe( 'when destroying token', function() {
		var user;

		before( function( done ) {
			seq( [
				function() { return users.destroyToken( 'userone', 'seven' ); },
				function() { return users.getByName( 'userone' ); }
				] )
			.then( null, function( err ) {
				console.log( err.stack );
			} )
			.then( function( x ) {
				user = x[ 1 ];
				done();
			} );
		} );

		it( 'should remove only the destroyed token', function() {
			user.name.should.equal( 'userone' );
			user.tokens.should.eql( [ 'six', 'eight' ] );
		} );

	} );

	describe( 'when getting by token', function() {
		var user;

		before( function( done ) {
			users.getByToken( 'six' )
				.then( null, function( err ) {
					console.log( err.stack );
				} )
				.then( function( x ) {
					user = x;
					done();
				} );
		} );

		it( 'should retrieve user record', function() {
			user.name.should.equal( 'userone' );
		} );

	} );

	describe( 'when changing user roles', function() {
		var roles;

		before( function( done ) {
			seq( [
				function() { return users.changeRoles( 'userone', [ 'r1', 'r2', 'r3', 'r4' ], 'add' ); },
				function() { return users.changeRoles( 'userone', [ 'r6', 'r2', 'r4', 'r5' ], 'add' ); },
				function() { return users.changeRoles( 'userone', [ 'r3', 'r1', 'r5' ], 'remove' ); },
				function() { return users.getRoles( 'userone' ); }
				] )
			.then( null, function( err ) {
				console.log( err );
			} )
			.then( function( x ) {
				roles = x[ 3 ];
				done();
			} );
		} );

		it( 'should only remove specified roles', function() {
			roles.sort().should.eql( [ 'r2', 'r4', 'r6' ] );
		} );

	} );

	describe( 'when disabling user', function() {
		var user;

		before( function( done ) {
			seq( [
				function() { return users.disable( 'userone' ); },
				function() { return users.getByName( 'userone' ); }
				] )
			.then( null, function( err ) {
				console.log( err.stack );
			} )
			.then( function( x ) {
				user = x[ 1 ];
				done();
			} );
		} );

		it( 'should mark user as disabled', function() {
			user.disabled.should.equal( true );
		} );

	} );

	describe( 'when enabling user', function() {
		var user;

		before( function( done ) {
			seq( [
				function() { return users.enable( 'userone' ); },
				function() { return users.getByName( 'userone' ); }
				] )
			.then( null, function( err ) {
				console.log( err.stack );
			} )
			.then( function( x ) {
				user = x[ 1 ];
				done();
			} );
		} );

		it( 'should mark user as enabled', function() {
			user.disabled.should.equal( false );
		} );

	} );

	describe( 'when checking for users', function() {
		var result;

		before( function( done ) {
			users.hasUsers()
				.then( function( x ) {
					result = x;
					done();
				} );
		} );

		it( 'should report true', function() {
			result.should.be.true; // jshint ignore:line
		} );
	} );

	describe( 'when paging through users', function() {
		var page1, page2, page3;

		before( function( done ) {
			pipe( [
				function( seed ) { return users.getList( seed ); },
				function( list ) { 
					page1 = list;
					return users.getList( list.continuation );
				},
				function( list ) { 
					page2 = list;
					return users.getList( list.continuation );
				}
				], { limit: 3 } )
			.then( null, function( err ) {
				console.log( 'FAIL', err.stack );
			} )
			.then( function( list ) {
				page3 = list;
				done();
			} );
		} );

		it( 'should pull all 3 pages', function() {
			page1.length.should.equal( 3 );
			page2.length.should.equal( 3 );
			page3.length.should.equal( 3 );
		} );

		it( 'should result in all users fetched', function() {
			var userList =[
				'usereight',
				'userfive',
				'userfour',
				'usernine',
				'userone', 
				'userseven',
				'usersix',
				'userthree',
				'usertwo'
			];
			_.flatten( [
				_.map( page1, 'name' ),
				_.map( page2, 'name' ),
				_.map( page3, 'name' )
			] ).sort().should.eql( userList );
		} );
	} );

	describe( 'when checking and no users', function() {
		before( function( done ) {
			var userList =[
				'userone', 
				'usertwo', 
				'userthree',
				'userfour',
				'userfive',
				'usersix', 
				'userseven',
				'usereight',
				'usernine' 
			];
			var deletes = _.map( userList, function( username ) {
				return users.delete( username );
			} );
			when.all( deletes )
				.then( function() {
					done();
				} );
		} );

		it( 'should report no users', function( done ) {
			this.timeout( 6000 );
			setTimeout( function() {
				users.hasUsers()
					.then( function( x ) {
						should( x ).not.be.true; // jshint ignore:line
						done();
					} );
			}, 4000 );
		} );
	} );
} );