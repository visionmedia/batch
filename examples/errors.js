
/**
 * Module dependencies.
 */

var Batch = require('..');

var n = 10;
var batch = Batch().throws(false);

while (n--) {
  (function(n){
    batch.push(function(done){
      setTimeout(function(){
        if(n % 2)
          done(null, n);
        else
          done(new Error(n), null);
      }, 100);
    })
  })(n);
}

batch.end(function(err, res){
  console.log(err, res);
});
