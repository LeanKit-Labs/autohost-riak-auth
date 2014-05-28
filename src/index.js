var when = require( 'when' );

module.exports = function( host, config, done ) {
	return when.promise( function( resolve, reject ) {
		var riak 			= require( './riak.js' )( host, config, function( hasUsers ) {
			authentication 	= require( './authentication.js' )( riak ),
			authorization 	= require( './authorization.js' )( riak ),
			passport = require( 'passport' ),
			BasicStrategy = require( 'passport-http' ).BasicStrategy;
			host.withAuthenticationProvider( authentication );
			host.withPassportStrategy(
				new BasicStrategy( {}, authentication.verify ),
				passport.authenticate( 'basic', { session: config.disable_sessions } ),
				/^[\/]anon.*/ );
			host.withAuthorizationProvider( authorization );
			var result = {
				authentication: authentication,
				authorization: authorization,
				hasUsers: hasUsers
			};
			resolve( result );
			if( done ) {
				done( result );
			}
		} );
	} );
};