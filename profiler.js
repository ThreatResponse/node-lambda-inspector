var exec = require('child_process').exec
var fs = require('fs');

// final results map
var results = {}

// helpers

/**
  * Writes stdout response to the results map
  */
var call_shell_wrapper = (resname, command, done) => {
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
  call_shell_wrapper('pwd', 'pwd', cb);
}

var get_cpuinfo = (cb) => {
  contents_of_file('cpuinfo', '/proc/cpuinfo', cb);
}

// main map of lookups to functions
// lookup functions should take one argument, a callback function with signature (err, data)
// that they call when they're done working.

var lookups = {
  "pwd":        get_pwd,
  "cpuinfo":    get_cpuinfo
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
        done(results);
      }
    }
  }

  for (var k in lookups) {
    lookups[k](make_lookup_callback(k));
  }
}

module.exports = {
  call_shell_wrapper: call_shell_wrapper,
  contents_of_file: contents_of_file,
  results: results,
  lookups: lookups,
  do_lookups: do_lookups
};
