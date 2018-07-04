'use strict'
const { isHash } = require('./isHash')
const { strIsInt } = require('./strIsInt')

module.exports = {
  isHash,
  strIsInt,
  log: require('./log'),
  fileExistsSync: require('./fileExistsSync')
}
