var exec = require('child_process').exec
var fs = require('fs');

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
  shell_wrapper: shell_wrapper,
  contents_of_file: contents_of_file,
  results: results,
  lookups: lookups,
  do_lookups: do_lookups
};
