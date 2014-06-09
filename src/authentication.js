var bcrypt = require('bcrypt'),
	when = require( 'when' ),
	_ = require( 'lodash' );
//require('when/monitor/console');

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
			//var hash = crypt( password, crypt.createSalt( 'blowfish' ) );
			var salt = bcrypt.genSaltSync(10);
			var hash = bcrypt.hashSync(password, salt);
			return when.promise( function ( resolve, reject ) {
				riak.user_auth
					.put( { id: username, password: hash, salt: salt }, { username: username } )
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
			//var hash = crypt( password, crypt.createSalt( 'blowfish' ) );
			//var hash = bcrypt.hashSync(password);
			var match = false;
			var promises = [], userList = [];
			return when.promise( function( resolve, reject ) {
				hasUsers()
					.then( null, function( err ) {
						reject( err );
					} )
					.then( function( exist ) {
						if( exist ) {
							riak.user_auth
								.getKeysByIndex( 'username', username )
								.progress( function( list ) {
									var promise = riak.user_auth.getByKeys( list.keys );
									promises.push( promise );
									promise
										.then( function( docs ) {
											_.each( docs, function( doc ) {
												userList.push( _.omit( doc, 'vclock' ) );
											} );
										} );
								} )
								.then( null, function( err ) {
									reject( err );
									done( err, false );
								} )
								.done( function () {
									when.all(promises).then(function() {
										if (userList.length == 0) {
											resolve(false);
										} else {
											var user = userList[0];
											var hash = bcrypt.hashSync(password, user.salt);
											if (hash == user.password) {
												resolve( _.merge( { id: username, name: username }, user ) );
												if( done ) {
													done( null, { id: username, name: username } );
												}
											} else {
												resolve( false );
												if( done ) {
													done( null, false );
												}
											}
										}
									});
								});
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