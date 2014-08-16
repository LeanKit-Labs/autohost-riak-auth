var util = require('util'),
	Strategy = require('passport-strategy').Strategy;

function TokenStrategy( verify ) {
	Strategy.call( this );
	this.name = 'token';
	this._verify = verify;
}

util.inherits( TokenStrategy, Strategy );

TokenStrategy.prototype.authenticate = function( req, options ) {
	var self = this;
	function verified( err, user, info ) {
		if ( err ) { return self.error( err ); }
		if ( !user ) { return self.fail( info ); }
		self.success( user, info );
	}
	var header = req.headers.authorization,
		token = readToken( header );
	this._verify( token, verified );
};

function readToken( header ) {
	return _.isEmpty( header ) ? undefined : header.split( ' ' )[ 1 ];
}

module.exports = TokenStrategy;