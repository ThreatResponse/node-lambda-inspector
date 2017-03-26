var profiler = require('./profiler.js')

exports.handler = (event, context, callback) => {
  profiler.do_lookups((err, res) => {
    callback(err, res);
  });
};
