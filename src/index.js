var crypt = require( 'bcrypt' ),
	when = require( 'when' ),
	passport = require( 'passport' ),
	Basic = require( 'passport-http' ).BasicStrategy,
	Bearer = require( 'passport-http-bearer' ).Strategy,
	Token = require( './tokenStrategy' ),
	_ = require( 'lodash' ),
	actions,
	roles,
	users,
	basicAuth,
	bearerAuth,
	tokenAuth;

function authenticate( req, res, next ) {
	var authorization = req.headers.authorization;
	if( /Token/i.test( authorization ) ) {
		tokenAuth( req, res, next );
	} else if( /Bearer/i.test( authorization ) ) {
		bearerAuth( req, res, next );
	} else {
		basicAuth( req, res, next );
	}
}

function authenticateCredentials( userName, password, done ) {
	verifyCredentials( userName, password )
		.then( function( result ) {
			done( null, result );
		} );
}

function authenticateToken( token, done ) {
	return users
		.getByToken( token )
		.then( null, function( err ) {
			done( err );
		} )
		.then( function( user ) {
			done( null, user || false );
		} );
}

function changePassword( username, password ) {
	var salt = crypt.genSaltSync( 10 ),
		hash = crypt.hashSync( password, salt );
	return users.changePassword( username, salt, hash );
}

function createUser( username, password ) {
	var salt = crypt.genSaltSync( 10 ),
		hash = crypt.hashSync( password, salt );
	return users.create( username, salt, hash );
}

function checkPermission( user, action ) {
	var actionName = action.roles ? action.name : action,
		actionRoles = _.isEmpty( action.roles ) ? actions.getRoles( actionName ) : action.roles,
		userName = user.name ? user.name : user,
		userRoles = _.isEmpty( user.roles ) ? users.getRoles( userName ) : user.roles;
	if( user.roles && user.disabled ) {
		userRoles = [];
	}
	return when.try( userCan, userRoles, actionRoles );
}

function createWrapper() {
	return {
		authenticate: authenticate,
		changeActionRoles: actions.changeRoles,
		changePassword: changePassword,
		changeUserRoles: users.changeRoles,
		checkPermission: checkPermission,
		createRole: roles.create,
		createUser: createUser,
		createToken: users.createToken,
		deleteAction: actions[ 'delete' ],
		deleteRole: roles[ 'delete' ],
		deleteUser: users[ 'delete' ],
		destroyToken: users.destroyToken,
		deserializeUser: deserializeUser,
		disableUser: users.disable,
		enableUser: users.enable,
		getActions: actions.getList,
		getActionRoles: actions.getRoles,
		getRoles: roles.getList,
		getTokens: users.getTokens,
		getUsers: users.getList,
		getUserRoles: users.getRoles,
		hasUsers: users.hasUsers,
		serializeUser: serializeUser,
		strategies: [
			new Basic( authenticateCredentials ),
			new Bearer( authenticateToken ),
			new Token( authenticateToken )
		],
		updateActions: updateActions,
		verifyCredentials: verifyCredentials
	};
}

function deserializeUser( user, done ) { done( null, user); }

function serializeUser( user, done ) { done( null, user ); }

function updateActions( actionList ) {
	var list = _.flatten(
			_.map( actionList, function( resource, resourceName ) {
				return _.map( resource, function( action ) { 
					return actions.create( action, resourceName );
				} );
			} ) );
	return when.all( list );
}

function userCan( userRoles, actionRoles ) {
	return actionRoles.length === 0 || _.intersection( actionRoles, userRoles ).length > 0;
}

function verifyCredentials( username, password ) {
	return users
		.getByName( username )
		.then( function( user ) {
			if( user ) {
				var valid = user.hash === crypt.hashSync( password, user.salt );
				return valid ? _.omit( user, 'hash', 'salt', 'tokens' ) : false;
			} else {
				return false;
			}
		} );
}

module.exports = function( config ) {
	actions = require( './store/actions.js' )( config );
	roles = require( './store/roles.js' )( config );
	users = require( './store/users.js' )( config );
	var useSession = !( config == undefined ? false : config.noSession ); // jshint ignore:line
	basicAuth = passport.authenticate( 'basic', { session: useSession } );
	bearerAuth = passport.authenticate( 'bearer', { session: useSession } );
	tokenAuth = passport.authenticate( 'token', { session: useSession } );
	return createWrapper();
};