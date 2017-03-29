var profiler = require('./profiler.js')

module.exports = function (cb) {
  profiler.do_lookups((res) => { cb(null, res); });
};
