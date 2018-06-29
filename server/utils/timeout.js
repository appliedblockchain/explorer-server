'use strict'

/* :: number -> Promise<void> */
const timeout = ms => new Promise(r => setTimeout(r, ms))

module.exports = timeout
