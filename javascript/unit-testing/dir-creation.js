var tmp = require('tmp');

var tmpobj = tmp.dirSync();
console.log('Dir: ', tmpobj.name);
// Manual cleanup
tmpobj.removeCallback();