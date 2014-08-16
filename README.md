## autohost auth provider shell
This library complies with autohost v0.2.0's auth provider specification and is just missing code to integrate with a backing store.

This library currently supports basic, OAuth2 (bearer) and generic token authorization headers. If no authorization header is present, a basic challenge is present.

The bulk of the effort should be isolated to changing the store/db.js file only. If those operations can be retrofitted onto your storage technology, the rest of the model should work. Specs have been provided that should cover the majority (if not all) of the features. If the specs pass, you should be ready to start using it with autohost.

## usage
```javascript
// see riaktive's README to see more information about how to configure pbc and http ports
// https://www.npmjs.org/package/riaktive
var host = require( 'autohost' ),
	authProvider = require( 'autohost-riak-auth' )( { appName: 'myApp', riak: { nodes: [
		{ host: 'riak-node1' },
		{ host: 'riak-node2' },
		{ host: 'riak-node3' },
	] } } );
host.init( {}, authProvider );
```
### appName
This library requires you to provide an `appName` property in the configuration object that it will use as a bucket suffix to differentiate different application authentication and authorization data. There is __no default value__, you must provide one.

### riak
As indicated by the comment above, the Riak property is how you pass along configuration to riaktive which controls how this library will connect to your Riak nodes.