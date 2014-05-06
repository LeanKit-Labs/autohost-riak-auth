var Riak = require( 'riaktive' ),
	when = require( 'when' ),
	riak;

module.exports = function( config, done ) {
	if( !riak ) {
		riak = Riak( config );
		var appName			= config.get( 'RIAK_AUTH_STORE', undefined ),
			userBucket 		= config.get( 'RIAK_BUCKET_USER_AUTH', 'user_auth' ),
			roleBucket 		= config.get( 'RIAK_BUCKET_ROLES', 'roles' ),
			actionBucket 	= config.get( 'RIAK_BUCKET_ACTIONS', 'actions' ),
			pathBucket 		= config.get( 'RIAK_BUCKET_PATHS', 'paths' );

		riak.connect().done( function() {
			var promises = [
				riak.createBucket( [ userBucket, appName ], { alias: 'user_auth' } ),
				riak.createBucket( [ roleBucket, appName ], { alias: 'roles' } ),
				riak.createBucket( [ actionBucket, appName ], { alias: 'actions' } ),
				riak.createBucket( [ pathBucket, appName ], { alias: 'paths' } )
			];
			when.all( promises ).done( done );
		} );
	}
	return riak;
};