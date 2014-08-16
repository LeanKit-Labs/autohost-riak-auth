var _ = require( 'lodash' ),
	users;

function addRoles( roles, user ) {
	user.roles = _.union( user.roles, roles );
	return user;
}

function changePassword( users, username, salt, hash ) {
	return users.update( username,
		function( user ) {
			user.salt = salt;
			user.hash = hash;
			return user;
		} );
}

function changeRoles( users, username, roles, verb ) {
	return users.update( username, verb === 'add' ? addRoles.bind( undefined, roles ) : removeRoles.bind( undefined, roles ) );
}

function createToken( users, username, token ) {
	return users.update( username,
		function( user ) {
			if( !user.tokens ) {
				user.tokens = [];
			}
			user.tokens.push( token );
			if( !user._indexes ) {
				user._indexes = { token: token };
			}
			if( !user._indexes.token ) {
				user._indexes.token = token;
			} else {
				user._indexes.token = _.flatten( [ token, user._indexes.token ] );
			}
			return user;
		} );
}

function create( users, username, salt, hash ) {
	return users.upsert( username, { name: username, salt: salt, hash: hash, roles: [], tokens: [] }, {} );
}

function destroyToken( users, username, token ) {
	return users.update( username,
		function( user ) {
			var tokens = user._indexes.token;
			if( _.isArray( tokens ) ) {
				user._indexes.token = _.without( tokens, token );
			} else if( tokens == token ) {
				delete user._indexes.token;
			}
			user.tokens = _.isEmpty( user.tokens ) ? [] : _.without( user.tokens, token );
			return user;
		} );
}

function disable( users, username ) {
	return users.update( username,
		function( user ) {
			user.disabled = true;
			return user;
		} );
}

function enable( users, username ) {
	return users.update( username,
		function( user ) {
			user.disabled = false;
			return user;
		} );
}

function getByName( users, username ) {
	return users.get( username );
}

function getByToken( users, token ) {
	var list = [];
	return users.fetch( { 
			index: 'token',
			start: token
		} )
		.progress( function( doc ) {
			list.push( _.omit( doc, 'tokens', 'hash', 'salt' ) ); 
		} )
		.then( function() {
			return list.length > 0 ? list[ 0 ] : undefined;
		} );
}

function getList( users, continuation ) {
	var opts = {
		index: '$key',
		start: '!',
		finish: '~'
	}, list = [];
	opts = _.merge( opts, continuation );
	opts.max_results = continuation ? ( continuation.limit || continuation.max_results ) : undefined;
	return users.fetch( opts )
		.progress( function( doc ) {
			list.push( _.omit( doc, 'tokens', 'hash', 'salt' ) );
		} )
		.then( function( next ) {
			list.continuation = next;
			return list;
		} );
}

function getRoles( users, username ) {
	return users.get( username )
		.then ( function( x ) {
			return x.disabled ? [] : x.roles; 
		} );
}

function getTokens( users, username ) {
	return users.get( username )
		.then ( function( x ) { return x.tokens; } )
		.then( function( list ) {
			return list;
		} );
}

function hasUsers( users ) {
	return users.hasRecords();
}

function purge( users, username ) {
	return users.purge( username );
}

function removeRoles( roles, user ) {
	user.roles = _.difference( user.roles, roles );
	return user;
}

module.exports = function( config ) {
	users = require( './db.js' )( config, 'users' );
	return {
		create: create.bind( undefined, users ),
		changePassword: changePassword.bind( undefined, users ),
		changeRoles: changeRoles.bind( undefined, users ),
		createToken: createToken.bind( undefined, users ),
		'delete': purge.bind( undefined, users ),
		destroyToken: destroyToken.bind( undefined, users ),
		disable: disable.bind( undefined, users ),
		enable: enable.bind( undefined, users ),
		getByName: getByName.bind( undefined, users ),
		getByToken: getByToken.bind( undefined, users ),
		getList: getList.bind( undefined, users ),
		getRoles: getRoles.bind( undefined, users ),
		getTokens: getTokens.bind( undefined, users ),
		hasUsers: hasUsers.bind( undefined, users )
	};
};