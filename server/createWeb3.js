'use strict'
const Web3 = require('web3')

/* :: string -> Web3 */
const createWeb3 = (ethereumJsonRPC) => {
  const provider = new Web3.providers.HttpProvider(ethereumJsonRPC)
  const web3 = new Web3(provider)

  return web3
}

module.exports = createWeb3
