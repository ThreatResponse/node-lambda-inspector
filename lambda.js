var profiler = require('./profiler.js')

exports.handler = (event, context, callback) => {
  profiler.do_lookups();
  
  setTimeout(() => { callback(null, profiler.results); }, 2000)
};
