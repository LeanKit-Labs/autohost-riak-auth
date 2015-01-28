var _ = require( 'lodash' ),
	roles;

function create( rolename ) {
	return roles.upsert( rolename, { name: rolename } );
}

function getList( continuation ) {
	var opts = {
			index: '$key',
			start: '!',
			finish: '~',
		},
		list = [];
	opts.max_results = continuation ? ( continuation.limit || continuation.max_results ) : undefined;
	return roles.fetch( _.merge( opts, continuation ) )
		.progress( function( doc ) {
			list.push( doc.name );
		} )
		.then( function() {
			return list;
		} );
}

function purge( rolename ) {
	return roles.purge( rolename );
}

module.exports = function( config ) {
	roles = require( './db.js' )( config, 'roles' );
	return {
		create: create,
		'delete': purge,
		getList: getList,
		removeAll: roles.empty.bind( roles )
	};
};
