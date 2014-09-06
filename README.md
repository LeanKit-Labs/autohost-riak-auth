## autohost riak auth
This library is a riak backed auth provider compliant with autohost v0.2.0's auth provider specification.

This library currently supports basic, OAuth2 (bearer) and generic token authorization headers. If no authorization header is present, a basic challenge is present.

## usage
```javascript
// see riaktive's README to see more information about how to configure pbc and http ports
// https://www.npmjs.org/package/riaktive
var host = require( 'autohost' );
var authProvider = require( 'autohost-riak-auth' )( {
		appName: 'myApp', 
		riak: { nodes: [
			{ host: 'riak-node1' },
			{ host: 'riak-node2' },
			{ host: 'riak-node3' },
		] } 
	} );
host.init( { /* autohost configuration goes here */ }, authProvider );
```

### appName
This library requires you to provide an `appName` property in the configuration object that it will use as a bucket suffix to differentiate different application authentication and authorization data. There is __no default value__, you must provide one.

### riak
As indicated by the comment above, the `riak` property is how you pass along configuration to riaktive which controls how this library will connect to your Riak nodes.