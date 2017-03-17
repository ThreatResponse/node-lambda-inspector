var exec = require('child_process').exec
var fs = require('fs');
var http = require('http');
var https = require('https');
var uuid = require('uuid4');

// final results map
var results = {}

// helpers

/**
  * Writes stdout response to the results map
  */
var shell_wrapper = (resname, command, done) => {
  exec(command, (err, stdout, stderr) => {
    results[resname] = stdout;

    done(err,stdout);
  });
}

var contents_of_file = (resname, fname, done) => {
  fs.readFile(fname, (err, data) => {
    if (err) {
      results[resname] = err;
    } else {
      results[resname] = data.toString();
    }

    done(err, data ? data.toString() : data);
  });
}

//individual lookups

var get_pwd = (cb) => {
  shell_wrapper('pwd', 'pwd', cb);
}

var get_cpuinfo = (cb) => {
  contents_of_file('cpuinfo', '/proc/cpuinfo', cb);
}

var get_runtime = (cb) => {
  cb(null, 'nodejs');
}

var get_etc_issue = (cb) => {
  contents_of_file('/etc/issue', '/etc/issue', cb);
}

var get_uname = (cb) => {
  shell_wrapper('uname', 'uname -a', cb);
}

var get_df = (cb) => {
  shell_wrapper('df', 'df -h', cb);
}

var get_dmesg = (cb) => {
  shell_wrapper('dmesg', 'dmesg', cb);
}

var get_processes = (cb) => {
  shell_wrapper('ps', 'ps aux', cb);
}

var get_timestamp = (cb) => {
  cb(null, Math.floor(Date.now() / 1000));
}

var sanitize_env = (dict) => {
  var sensitive_vars = ["AWS_SESSION_TOKEN",
                        "AWS_SECURITY_TOKEN",
                        "AWS_ACCESS_KEY_ID",
                        "AWS_SECRET_ACCESS_KEY"]

  for (var i = 0; i < sensitive_vars.length; i++) {
    if (dict[sensitive_vars[i]]) {
      dict[sensitive_vars[i]] = dict[sensitive_vars[i]].substring(0, 12);
    }
  }
}

var get_env = (cb) => {
  var env_clone = JSON.parse(JSON.stringify(process.env))
  sanitize_env(env_clone);

  cb(null, env_clone);
}

// saving of data via post or s3
// later, make a wrapper for the storing results that's agnostic like python
var store_results_api = (results, cb) => {
  // seems to currently be sending bad JSON occasionally that maybe breaks the server?
  // ran it with ONLY 'pwd' active after a couple bad runs and it still gave a 400, but
  // I ran a 'pwd-only' submission last night and it worked fine after the api was just bounced.

  //This is what is getting posted later down the line
  //console.log(unescape(JSON.stringify(results),encoding='utf8'));
  var body = JSON.stringify(results);
  var options = {
    "hostname": "showdown-api.ephemeralsystems.com",
    "port": 443,
    "path": "/",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body)
    },
  };


  var req = https.request(options, (res) => {

    console.log(`statusCode: ${res.statusCode}`);

    if (res.statusCode == 200) {
      console.log('good');
      cb(null, true);
    } else {
      console.log('falling back to s3');
      cb('err', null);
      //store_results_s3(results, cb);
    }

  });

  req.on('error', (e) => {
    console.log(req.body)
    console.log(`problem with post: ${e.message}`);
    cb(e.message, null);
  });

  console.log('sending request');

  req.end(body);
}

// currently unused, since it doesn't compress at all.
// enable by uncommenting in store_results_api (or calling directly from do_lookups)
var store_results_s3 = (results, cb) => {
  // setting up the AWS S3 stuff takes ~3 seconds
  var AWS = require('aws-sdk');
  var s3 = new AWS.S3();
  var s3_bucket = 'threatresponse.showdown';
  var s3_name = `${uuid().replace(/-/g, '')}.json`

  var zlib = require('zlib');
  var compressed_results = zlib.gzipSync(JSON.stringify(results));

  var params = {
    "Bucket": s3_bucket,
    "Key": s3_name,
    "Body": compressed_results
  };

  s3.putObject(params, (err, data) => {
    cb(err, data);
  });

}

// main map of lookups to functions
// lookup functions should take one argument, a callback function with signature (err, data)
// that they call when they're done working.

var lookups = {
  "pwd":        get_pwd,
  "cpuinfo":    get_cpuinfo,
  "runtime":    get_runtime,
  "/etc/issue": get_etc_issue,
  "uname":      get_uname,
  "df":         get_df,
  "dmesg":      get_dmesg,
  "ps":         get_processes,
  "timestamp":  get_timestamp,
  "env":        get_env,
}

// Call every lookup fn in the lookups map
// When the last one finishes, call back 'done' with the results map.
var do_lookups = (done) => {
  var num_lookups = Object.keys(lookups).length

  var make_lookup_callback = (name) => {
    return (err, data) => {
      num_lookups--;

      results[name] = err ? err : data

      if (num_lookups == 0) {

        // store_results_s3(results, done);
        store_results_api(results, done);
      }
    }
  }

  for (var k in lookups) {
    lookups[k](make_lookup_callback(k));
  }
}

module.exports = {
  shell_wrapper: shell_wrapper,
  contents_of_file: contents_of_file,
  results: results,
  lookups: lookups,
  do_lookups: do_lookups
};


//Node equivalent of a main in case we're using single file
if (!module.parent) {
  do_lookups((err, res) => {
    console.log('finished!');
    console.log(`error: ${err}`);
    console.log(`result: ${res}`);
  });
} else {
  // we were require()d from somewhere else
}
