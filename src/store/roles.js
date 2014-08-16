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
	}, list = [];
	return roles.fetch( continuation || opts )
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
		getList: getList
	};
};