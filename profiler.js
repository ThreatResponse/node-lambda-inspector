var exec = require('child_process').exec
var fs = require('fs');

var results = {}

// TODO: change this to use promises? to track when async fns are done
// since fs calls & more are async

/**
  * Writes stdout response to the results map
  */
var call_shell_wrapper = (resname, command, done) => {
  exec(command, (err, stdout, stderr) => {
    results[resname] = stdout;

    done();
  });
}

var contents_of_file = (resname, fname, done) => {
  fs.readFile(fname, (err, data) => {
    if (err) {
      results[resname] = err;
    } else {
      results[resname] = data.toString();
    }

    done();
  });
}

var get_pwd = (cb) => {
  call_shell_wrapper('pwd', 'pwd', cb);
}

var get_cpuinfo = (cb) => {
  contents_of_file('cpuinfo', '/proc/cpuinfo', cb);
}

var lookups = {
  "pwd":        get_pwd,
  "cpuinfo":    get_cpuinfo
}

var do_lookups = (done) => {
  var num_lookups = Object.keys(lookups).length

  var dec_num_lookups = () => {
    num_lookups--;

    if (num_lookups == 0) {
      done(results);
    }
  }

  for (var k in lookups) {
    lookups[k](dec_num_lookups);
  }
}

module.exports = {
  call_shell_wrapper: call_shell_wrapper,
  contents_of_file: contents_of_file,
  results: results,
  lookups: lookups,
  do_lookups: do_lookups
};
