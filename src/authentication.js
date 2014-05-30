var crypt = require( 'crypt3' ),
	when = require( 'when' ),
	_ = require( 'lodash' );
require('when/monitor/console');

module.exports = function( riak ) {
	var usersExist = undefined,
		countPromise = function() {
			return when.promise( function( resolve, reject ) {
				riak.user_auth.getKeysByIndex( '$key', '!', '~', 5 )
					.progress( function( list ) {
						if( list && list.keys && list.keys.length > 0 ) {
							usersExist = true;
						}
					} )
					.then( null, function( err ) {
						reject( err );
					} )
					.then( function() {
						resolve( usersExist );
					} );
			} );
		},
		hasUsers = function() {
			return usersExist ? when( usersExist ) : countPromise();
		};
	return {
		create: function( username, password, done ) {
			var hash = crypt( password, crypt.createSalt( 'blowfish' ) );
			return when.promise( function ( resolve, reject ) {
				riak.user_auth
					.put( { id: username, password: hash }, { password: hash } )
					.then( null, function( err ) {
						reject( err );
						if( done ) {
							done( err );
						}
					} )
					.then( function() {
						resolve();
						if( done ) {
							done();
						}
					} );
			} );
		},
		disable: function( username, done ) {
			return when.promise( function( resolve, reject ) {
				riak.user_auth.mutate( username, function( user ) {
					user[ 'disabled' ] = true;
					return user;
				} )
				.then( null, function( err ) {
					reject( err );
					if( done ) {
						done( err, false );
					}
				} )
				.then( function() {
					resolve();
				} );
			} );
		},
		enable: function( username, done ) {
			return when.promise( function( resolve, reject ) {
				riak.user_auth.mutate( username, function( user ) {
					delete user[ 'disabled' ];
					return user;
				} )
				.then( null, function( err ) {
					reject( err );
					if( done ) {
						done( err, false );
					}
				} )
				.then( function() {
					resolve();
				} );
			} );
		},
		hasUsers: hasUsers,
		verify: function( username, password, done ) {
			var hash = crypt( password, crypt.createSalt( 'blowfish' ) ),
				match = false;
			return when.promise( function( resolve, reject ) {
				hasUsers()
					.then( null, function( err ) {
						reject( err );
					} )
					.then( function( exist ) {
						if( exist ) {
							riak.user_auth
								.getKeysByIndex( 'password', hash )
								.progress( function( list ) {
									if( _.indexOf( list.keys, username ) >= 0 ) {
										match = true;
										riak.user_auth.get( username )
											.then( null, function() {
												resolve( null );
											} )
											.then( function( user ) {
												resolve( _.merge( { id: username, name: username }, user ) );
											} );
										if( done ) {
											done( null, { id: username, name: username } );
										}
									}
								} )
								.then( null, function( err ) {
									reject( err );
									done( err, false );
								} )
								.then( function( keys ) {
									if( !match ) {
										resolve( false );
										if( done ) {
											done( null, false );
										}
									}
								} );
						} else {
							if( done ) {
								done( null, { id: 'anonymous', name: 'anonymous' } );
							}
							resolve( { id: 'anonymous', name: 'anonymous' } );
						}
					} );
			}.bind( this ) );
		}
	};
};