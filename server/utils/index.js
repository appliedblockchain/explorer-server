'use strict'
const { isHash } = require('./isHash')
const { strIsInt } = require('./strIsInt')
const withRetry = require('./withRetry')

module.exports = {
  isHash,
  strIsInt,
  withRetry,
  log: require('./log'),
  fileExistsSync: require('./fileExistsSync')
}
