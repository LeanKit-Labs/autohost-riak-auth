var when = require( 'when' );

module.exports = function( autohost, config, done ) {
	return when.promise( function( resolve, reject ) {
		var riak 			= require( './riak.js' )( config, function() {
			authentication 	= require( './authentication.js' )( riak ),
			authorization 	= require( './authorization.js' )( riak ),
			passport = require( 'passport' ),
			BasicStrategy = require( 'passport-http' ).BasicStrategy;
			autohost.withAuthenticationProvider( authentication );
			autohost.withPassportStrategy(
				new BasicStrategy( {}, authentication.verify ),
				passport.authenticate( 'basic', { session: config.disable_sessions } ),
				/^[\/]anon.*/ );
			autohost.withAuthorizationProvider( authorization );
			resolve();
			if( done ) {
				done();
			}
		} );
	} );
};