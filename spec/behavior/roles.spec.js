var _ = require( 'lodash' );
var should = require( 'should' );
var when = require( 'when' );
var seq = require( 'when/sequence' );
var pipe = require( 'when/pipeline' );
var roles = require( '../../src/store/roles.js' )( { appName: 'spec', riak: { host: 'localhost' } } );

describe( 'Roles', function() {
	describe( 'when creating, listing and removing roles', function() {
		var list1, list2;

		before( function( done ) {
			seq( [ function() {
					return roles.create( 'role-n' );
				}, function() {
					return roles.create( 'role-o' );
				}, function() {
					return roles.create( 'role-d' );
				}, function() {
					return roles.create( 'role-e' );
				}, function() {
					return roles.getList();
				}, function() {
					return roles.delete( 'role-n' );
				}, function() {
					return roles.delete( 'role-o' );
				}, function() {
					return roles.delete( 'role-d' );
				}, function() {
					return roles.delete( 'role-e' );
				}, function() {
					return roles.getList();
				}
			] )
				.then( null, function( err ) {
					console.log( 'OH NO!', err.stack );
				} )
				.then( function( results ) {
					list1 = results[ 4 ];
					list2 = results[ 9 ];
					done();
				} );
		} );

		it( 'should create roles', function() {
			list1.sort().should.eql( [ 'role-d', 'role-e', 'role-n', 'role-o' ] );
		} );

		it( 'should remove roles', function() {
			list2.should.eql( [] );
		} );
	} );
} );
