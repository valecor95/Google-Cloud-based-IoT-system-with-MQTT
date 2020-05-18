const moment = require('moment');

module.exports = {
  //to remove html tags
  stripTags: function(input){
    return input.replace(/<(?:.|\n)*?>/gm, '');
  },
  eq: function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  }
}
