'use strict'
const createDebug = require('debug')
const pkg = require('../../package.json')

const { name } = pkg
const debug = createDebug(name)

/* (string, string) -> void */
const debugWithScope = (scope = false) => msg => {
  if (!scope) {
    debug(msg)
  } else {
    debug(`${scope}: ${msg}`)
  }
}

module.exports = debugWithScope
