var exec = require('child_process').exec
var fs = require('fs');

var results = {}

// TODO: change this to use promises? to track when async fns are done
// since fs calls & more are async

/**
  * Writes stdout response to the results map
  */
var call_shell_wrapper = (resname, command) => {
  exec(command, (err, stdout, stderr) => { results[resname] = stdout; });
}

var contents_of_file = (resname, fname) => {
  fs.readFile(fname, (err, data) => {
    if (err) {
      results[resname] = err;
    } else {
      results[resname] = data.toString();
    }
  });
}

var get_pwd = () => {
  call_shell_wrapper('pwd', 'pwd');
}

var get_cpuinfo = () => {
  contents_of_file('cpuinfo', '/proc/cpuinfo');
}

var lookups = {
  "pwd":        get_pwd,
  "cpuinfo":    get_cpuinfo
}

var do_lookups = () => {
  // as long as lookups doesn't get added params should be fine
  for (var k in lookups) {
    lookups[k]();
  }
}

module.exports = {
  call_shell_wrapper: call_shell_wrapper,
  contents_of_file: contents_of_file,
  results: results,
  lookups: lookups,
  do_lookups: do_lookups
};
