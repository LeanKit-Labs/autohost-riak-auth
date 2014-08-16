var actions;
var _ = require( 'lodash' );

function addRoles( roles, action ) {
	action.roles = _.union( action.roles, roles );
	return action;
}

function changeRoles( actions, actionname, roles, verb ) {
	return actions.update( actionname, verb === 'add' ? 
		addRoles.bind( undefined, roles ) : 
		removeRoles.bind( undefined, roles ) );
}

function create( actions, actionname, resource ) {
	return actions.upsert( actionname, { name: actionname, resource: resource, roles: [] }, { name: actionname } );
}

function getList( actions, continuation ) {
	var opts = {
		index: '$key',
		start: '!',
		finish: '~',
	}, list = [];
	return actions.fetch( continuation || opts )
		.progress( function( doc ) {
			list.push( doc );
		} )
		.then( function( durp ) {
			return list;
		} );
}

function getRoles( actions, actionname ) {
	return actions.get( actionname )
		.then( function( action ) {
			return ( action && action.roles ) ? action.roles : [];
		} );
}

function purge( actions, actionname ) {
	return actions.purge( actionname );
}

function removeRoles( roles, action ) {
	action.roles = _.difference( action.roles, roles );
	return action;
}

module.exports = function( config ) {
	actions = require( './db.js' )( config, 'actions' );
	return {
		changeRoles: changeRoles.bind( undefined, actions ),
		create: create.bind( undefined, actions ),
		'delete': purge.bind( undefined, actions ),
		getList: getList.bind( undefined, actions ),
		getRoles: getRoles.bind( undefined, actions )
	};
};