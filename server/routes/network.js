'use strict'
const Router = require('koa-router')

/* :: Web3 -> Router */
const createNetworkRouter = (web3) => {
  const router = new Router()

  router.get('/network', async (ctx) => {
    const [ networkId, peerCount, isListening ] = await Promise.all([
      web3.eth.net.getId(),
      web3.eth.net.getPeerCount(),
      web3.eth.net.isListening()
    ])

    ctx.body = {
      status: 'OK',
      data: {
        networkId,
        peerCount,
        isListening
      }
    }
  })

  return router
}

module.exports = createNetworkRouter
