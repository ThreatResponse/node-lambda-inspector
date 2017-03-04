var profiler = require('./profiler.js')

exports.handler = (event, context, callback) => {
  profiler.do_lookups((res) => { callback(null, res); });
};
