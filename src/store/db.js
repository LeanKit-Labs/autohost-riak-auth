// by supplying an implementation to these operations for your backing store
// the action, user and role modules should be able to fulfill all
// calls necessary to complete the API
var _ = require( 'lodash' );
var path = require( 'path' );
var when = require( 'when' );
var riaktive = require( 'riaktive' );
var riak;

function hasRecords( bucket ) {
	var hasRecord;
	return bucket.getKeysByIndex( '$key', '!', '~', 1 )
			.progress( function( list ) {
				if( list && list.length > 0 ) {
					hasRecord = true;
				}
			} )
			.then( function() {
				return hasRecord;
			} );
}

function fetch( bucket, pattern, map, continuation ) {
	map = map || function( x ) { 
		return x; 
	};
	var apply = function( list ) { return _.map( list, map ); };
	var op = bucket.getByIndex( pattern );
	return op.progress( map );
}

function insert( bucket, key, doc, index ) {
	return bucket.put( key, doc, index );
}

function purge( bucket, key ) {
	return bucket.del( key );
}

function update( bucket, key, change ) {
	return bucket.mutate( key, change );
}

function upsert( bucket, key, doc, index ) {
	return when.promise( function( resolve, reject ) {
		bucket.get( key )
			.then( function( original ) {
				if( original ) {
					bucket.mutate( key, function( x ) { return _.assign( x, doc ); } )
						.then( resolve, reject );
				} else {
					bucket.put( key, doc, index )
						.then( resolve, reject );
				}
			} );
	} );
}

module.exports = function( config, bucketName ) {
	if( !riak ) {
		riak = riaktive.connect( config.riak );
	}
	var bucket = riak.bucket( [ bucketName, config.appName ], { alias: bucketName } );
	return {
		hasRecords: hasRecords.bind( undefined, bucket ),
		fetch: fetch.bind( undefined, bucket ),
		get: bucket.get.bind( bucket ),
		insert: insert.bind( undefined, bucket ),
		purge: purge.bind( undefined, bucket ),
		update: update.bind( undefined, bucket ),
		upsert: upsert.bind( undefined, bucket )
	};
};