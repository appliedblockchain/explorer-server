'use strict'
const { isString } = require('lodash')
const { isPrefixedHex, isUnprefixedHex } = require('@appliedblockchain/bdash')

/* any -> boolean */
const isHash = val => {
  if (!isString(val)) {
    return false
  }

  switch (val.length) {
    case 64:
      return isUnprefixedHex(val)
    case 66:
      return isPrefixedHex(val)
    default:
      return false
  }
}

module.exports = { isHash }
