'use strict'
const Web3 = require('web3')

/* :: string -> Web3 */
const createWeb3 = (ethereumJsonRPC) => {
  return new Web3(ethereumJsonRPC)
}

module.exports = createWeb3
