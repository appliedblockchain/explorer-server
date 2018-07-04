'use strict'

/* string -> boolean */
const strIsInt = str => {
  const p = parseInt(str, 10)

  return !Number.isNaN(p) && String(p).length === str.length
}

module.exports = { strIsInt }
