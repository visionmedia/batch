
/**
 * Module dependencies.
 */

var Batch = require('..');

var n = 10;
var batch = new Batch;

while (n--) {
  (function(n){
    batch.push(function(done){
      setTimeout(function(){
        done(null, n);
      }, 100);
    })
  })(n);
}

batch.end(function(err, res){
  console.log(res);
});
