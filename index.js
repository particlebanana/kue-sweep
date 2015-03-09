(function() {
  /**
  * Module dependencies
  */

  var kue = require('kue');
  var _ = require('lodash');
  var url = require('url');

  // Create connection config
  var redisUrl = url.parse(process.env.REDIS_URL || 'redis://localhost:6379');
  var redisConfig = {
    host: redisUrl.hostname,
    port: Number(redisUrl.port)
  };

  if (redisUrl.auth) {
    redisConfig.auth = redisUrl.auth.split(":")[1];
  }

  var Queue = kue.createQueue({
    redis: redisConfig
  });

  Queue.on('job complete', function(id) {
    kue.Job.get(id, function(err, job) {
      if ((err != null) || (job == null)) {
        console.warn("[kue-sweep::on job completed] fail to get job: " + id + ". error:" + err);
        return;
      }
      console.log("[kue-sweep::removeKueJob] job:" + job.id);
      if (!((job != null) && _.isFunction(job.remove))) {
        console.error("[kue-sweep::removeKueJob] bad argument, " + job);
        return;
      } else {
        job.remove();
      }
    });
  });

  process.on('uncaughtException', function(error) {
    return console.log("[kue-sweep::uncaughtException] " + error + ", stack:" + error.stack);
  });

  console.info("[kue-sweep::init] service is up for redis server @ " + redisConfig.host + ":" + redisConfig.port);
}).call(this)