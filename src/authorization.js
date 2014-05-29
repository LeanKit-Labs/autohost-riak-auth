var when = require( 'when' ),
	_ = require( 'lodash' );
module.exports = function( riak ) {
	var provider = {
		actionList: function( list, done ) {
			var promises = [];
			when.all( _.map( list, function( action ) {
				return riak.actions.get( action.name )
					.then( function( doc ) {
						if( !doc ) {
							promises.push( riak.actions.put( 
								{ id: action.name, resource: action.resource, roles: [] }, 
								{ 'resource': action.resource } ) 
							);
						} else {
							promises.push( when( true ) );
						}
					} );
			} ) ).done( function() {
				when.all( promises ).done( done );
			} );
		},
		checkPermission: function( user, action, done ) {
			var userRoles,
				actionRoles,
				userPromise,
				actionPromise;
			if( _.isObject( user ) && user.roles ) {
				userRoles = user.disabled ? [] : user.roles;
				userPromise = when( userRoles );
			} else {
				userPromise = when.promise( function( resolve, reject ) {
					this.getUserRoles( user, function( err, roles ) {
						userRoles = roles;
						resolve( userRoles );
					} );
				}.bind( this ) );
			}
			if( _.isObject( action ) && action.roles ) {
				actionRoles = action.roles;
				actionPromise = when( actionRoles );
			} else {
				actionPromise = when.promise( function( resolve, reject ) {
					this.getRolesFor( action, function( err, roles ) {
						actionRoles = roles;
						resolve( actionRoles );
					} );
				}.bind( this ) );
			}
			return when.promise( function( resolve ) {
				when.all( [ userPromise, actionPromise ] )
				.done( function() {
					var intersect = ( _.intersection( actionRoles, userRoles ).length > 0 );
					resolve( intersect );
					if( done ) {
						done( null, intersect );
					}
				} );
			} );
		},
		getUserRoles: function( userName, done ) {
			return when.promise( function( resolve ) {
				riak.user_auth.get( userName )
					.then( null, function( err ) {
						resolve( [] );
						if( done ) {
							done( err, null );
						}
					} )
					.then( function( user ) {
						var roles = ( user == undefined || user.disabled ) ? [] : user.roles || [];
						resolve( roles );
						if( done ) {
							done( null, roles );
						}
					} );
			} );
		},
		getRolesFor: function( actionName, done ) {
			return when.promise( function( resolve ) {
				riak.actions.get( actionName )
					.then( null, function( err ) {
						resolve( [] );
						if( done ) {
							done( err, [] );
						}
					} )
					.then( function( action ) {
						var roles = action ? action.roles || [] : [];
						resolve( roles );
						if( done ) {
							done( null, roles );
						}
					} );
			} );
		},
		getUserList: function( done ) {
			var list = [],
				promises = [];
			return when.promise( function( resolve ) {
				riak.user_auth.getKeysByIndex( '$key', '!', '~', 512 )
					.progress( function( resp ) {
						var promise = riak.user_auth.getByKeys( resp.keys );
						promises.push( promise );
						promise
							.then( function( docs ) {
								_.each( docs, function( doc ) {
									doc.roles = doc.roles || [];
									doc.name = doc.id;
									list.push( _.omit( doc, 'vclock' ) );
								} );
							} );
					} )
					.done( function( continuation ) {
						if( continuation ) {
							list.continuation = continuation;
						}
						when.all( promises )
							.then( function() {
								resolve( list );
								if( done ) {
									done( undefined, list );
								}
							} );
					} );
			} );
		},
		getActionList: function( done ) {
			var list = {},
				promises = [];
			return when.promise( function( resolve ) {
				riak.actions.getKeysByIndex( '$key', '!', '~', 512 )
					.progress( function( resp ) {
						var promise = riak.actions.getByKeys( resp.keys );
						promises.push( promise );
						promise
							.then( function( docs ) {
								_.each( docs, function( doc ) {
									doc.roles = doc.roles || [];
									doc.name = doc.id;
									var resource = [];
									if( !list[ doc.resource ] ) {
										list[ doc.resource ] = resource;
									} else {
										resource = list[ doc.resource ];
									}
									resource.push( _.omit( doc, 'vclock' ) );
								} );
							} )
					} )
					.done( function( continuation ) {
						if( continuation ) {
							list.continuation = continuation;
						}
						if( done ) {
							done( undefined, list );
						}
						when.all( promises ).then( function() {
							resolve( list );
						} );
					} );
			} );
		},
		getRoleList: function( done ) {
			var list = [];
			return when.promise( function ( resolve ) {
				riak.roles.getKeysByIndex( '$key', '!', '~', 512 )
					.progress( function( resp ) {
						list = list.concat( resp.keys );
					} )
					.done( function( continuation ) {
						if( continuation ) {
							list.continuation = continuation;	
						}						
						if( done ) {
							done( undefined, list );
						}
						resolve( list );
					} );
			} );
		},
		addActionRoles: function( action, roles, done ) {
			return when.promise( function ( resolve, reject ) {
				riak.actions.mutate( action, function( doc ) {
						doc.roles = doc.roles.concat( roles );
						return doc;
					} )
					.then( null, function( err ) {
						if( done ) {
							done( err );
						}
						reject( err );
					} )
					.then( function() {
						if( done ) {
							done();
						}
						resolve();
					} );
			} );
		},
		removeActionRoles: function( action, roles, done ) {
			return when.promise( function ( resolve, reject ) {
				riak.actions.mutate( action, function( doc ) {
						doc.roles = _.difference( doc.roles, roles );
						return doc;
					} )
					.then( null, function( err ) {
						if( done ) {
							done( err );
						}
						reject( err );
					} )
					.then( function() {
						if( done ) {
							done();
						}
						resolve();
					} );
			} );
		},
		addUserRoles: function( user, roles, done ) {
			return when.promise( function ( resolve, reject ) {
				riak.user_auth.mutate( user, function( doc ) {
						doc.roles = doc.roles ? doc.roles.concat( roles ) : roles;
						return doc;
					} )
					.then( null, function( err ) {
						if( done ) {
							done( err );
						}
						reject( err );
					} )
					.then( function() {
						if( done ) {
							done();
						}
						resolve();
					} );
			} );
		},
		removeUserRoles: function( user, roles, done ) {
			return when.promise( function ( resolve, reject ) {
				riak.user_auth.mutate( user, function( doc ) {
						doc.roles = _.difference( doc.roles, roles );
						return doc;
					} )
					.then( null, function( err ) {
						if( done ) {
							done( err );
						}
						reject( err );
					} )
					.then( function() {
						if( done ) {
							done();
						}
						resolve();
					} );
			} );
		},
		setActionRoles: function( action, roles, done ) {
			return when.promise( function ( resolve, reject ) {
				riak.actions.mutate( action, function( doc ) {
						doc.roles = roles;
						return doc;
					} )
					.then( null, function( err ) {
						if( done ) {
							done( err );
						}
						reject( err );
					} )
					.then( function() {
						if( done ) {
							done();
						}
						resolve();
					} );
			} );
		},
		setUserRoles: function( user, roles, done ) {
			return when.promise( function( resolve, reject ) {
				riak.user_auth.put( {
					id: user,
					roles: roles || []
				} )
				.then( null, function( err ) {
					if( done ) {
						done( err );
					}
					reject( err );
				} )
				.then( function() {
					if( done ) {
						done();
					}
					resolve();
				} );
			} );
		},
		addRole: function( role, done ) {
			return when.promise( function( resolve, reject ) {
				riak.roles.put( {
					id: role
				} )
				.then( null, function( err ) {
					if( done ) {
						done( err );
					}
					reject( err );
				} )
				.then( function() {
					if( done ) {
						done();
					}
					resolve();
				} );
			} );
		},
		removeRole: function( role, done ) {
			return when.promise( function( resolve, reject ) {
				riak.roles.del( {
					id: role
				} )
				.then( null, function( err ) {
					if( done ) {
						done( err );
					}
					reject( err );
				} )
				.then( function() {
					if( done ) {
						done();
					}
					resolve();
				} );
			} );
		}
	};
	_.bindAll( provider );
	return provider;
};