module.exports = function() {
	return {
		name: 'test',
		actions: {
			hi: {
				url: '/hi',
				method: 'get',
				handle: function( env ) {
					env.reply( { data: 'hello, ' + env.user.name + '!' } );
				}
			},
			anon: {
				url: '/anon',
				method: 'get',
				handle: function( env ) {
					env.reply( { data: 'who are you?', status: 203 } );
				}
			}
		}
	};
};
