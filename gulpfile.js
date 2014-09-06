var gulp = require( 'gulp' ),
	mocha = require( 'gulp-mocha' );

gulp.task( 'test', function() {
	return gulp.src( [ './spec/users.spec.js', './spec/actions.spec.js', './spec/auth.spec.js', './spec/roles.spec.js' ], { read: false } )
		.pipe( mocha( { reporter: 'spec' } ) )
		.on( 'end', process.exit.bind( process, 0 ) )
		.on( 'error', process.exit.bind( process, 1 ) );
} );

gulp.task( 'continuous-test', function() {
	return gulp.src( [ './spec/users.spec.js', './spec/actions.spec.js', './spec/auth.spec.js', './spec/roles.spec.js' ], { read: false } )
		.pipe( mocha( { reporter: 'spec' } ) );
} );

gulp.task( 'watch', function() {
	gulp.watch( [ './src/**', './spec/**' ], [ 'continuous-test' ] );
} );

gulp.task( 'default', [ 'continuous-test', 'watch' ], function() {
} );