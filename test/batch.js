
var Batch = require('../');

describe('Batch', function(){
  var batch;

  beforeEach(function(){
    batch = new Batch;
  })

  describe('#end(callback)', function(){
    describe('when no functions are queued', function(){
      it('should invoke the callback', function(done){
        batch.end(done);
      })
    })

    it('construct an array of results in order', function(done){
      batch.push(function(fn){
        setTimeout(function(){
          fn(null, 'foo');
        }, 100);
      });
      
      batch.push(function(fn){
        setTimeout(function(){
          fn(null, 'bar');
        }, 50);
      });

      batch.end(function(err, res){
        if (err) return done(err);
        res.should.eql(['foo', 'bar']);
        done();
      })
    })

    describe('when several functions are queued', function(){
      it('should invoke the callback', function(done){
        batch.push(function(fn){
          process.nextTick(fn);
        })
        
        batch.push(function(fn){
          process.nextTick(fn);
        })

        batch.end(done);
      })
    })
        
    describe('when a queued function is completed', function(){
      it('should emit "progress" events', function(done){
          
        batch.push(function(fn){
          fn(null, 'foo');
        });
            
        batch.push(function(fn){
          fn(null, 'bar');
        });

        batch.push(function(fn){
          fn(null, 'baz');
        });

        var pending = 3;
        batch.on('progress', function(e){
          switch (e.index) {
            case 0:
              e.value.should.equal('foo');
              e.percent.should.be.a('number');
              e.total.should.be.a('number');
              e.complete.should.be.a('number');
              e.pending.should.be.a('number');
              e.duration.should.be.a('number');
              break;
            case 1:
              e.value.should.equal('bar');
              e.percent.should.be.a('number');
              break;
            case 2:
              e.value.should.equal('baz');
              e.percent.should.be.a('number');
              break;
          }

          --pending || done();
        })
          
        batch.end(function(err, res){
          if (err) return done(err);
        })
      })
    })
    
    describe('when several errors occur', function(){
      it('should invoke the callback with the first error', function(done){
        batch.push(function(fn){
          fn(new Error('fail one'));
        })
        
        batch.push(function(fn){
          fn(new Error('fail two'));
        })

        batch.end(function(err){
          err.message.should.equal('fail one');
          done();
        });
      })
    })
    
    describe('when .throwUp(false) is in effect', function(){
      it('errors should pile up', function(done){
        batch.push(function(fn){
          fn(null, 'foo');
        });

        batch.push(function(fn){
          fn(new Error('fail one'));
        });
            
        batch.push(function(fn){
          fn(null, 'bar');
        });
        
        batch.push(function(fn){
          fn(new Error('fail two'));
        });

        batch.push(function(fn){
          fn(null, 'baz');
        });

        batch.throwUp(false);

        batch.end(function(err, res){
          err.should.be.an.instanceOf(Array);
          err[0].should.equal(null);
          err[1].message.should.equal('fail one');
          err[2].should.equal(null);
          err[3].message.should.equal('fail two');
          err[4].should.equal(null);

          res.should.eql(['foo', undefined, 'bar', undefined, 'baz']);

          done();
        });
      })
    })
  })
})