'use strict'
const { times, flatten, get } = require('lodash')
const createFixedStack = require('../../utils/createFixedStack')
const withRetry = require('../../utils/withRetry')

/** Total number of blocks to search Transactions in parallel */
const BLOCKS_IN_PARALLEL = 100
const MAX_TXS = 100

/** Transactions Cache used for serving requests */
const latestTxs = createFixedStack(MAX_TXS, { hash: '––', loading: true })


/* :: (object, number, number) -> Promise<object> */
const fetchTxs = async (web3, blockNumber, distance) => {
  const promises = times(distance)
    .map(i => web3.eth.getBlock(blockNumber - i, true))

  const blocks = await Promise.all(promises)
  const txs = blocks.map((block) => get(block, 'transactions', []))

  return flatten(txs)
}


/* :: (object, number) -> Promise<number[]> */
const getLatestTransactions = async (web3, limit) => {
  const txs = []

  let lastBlock = await web3.eth.getBlockNumber()

  while (txs.length < limit) {
    const args = [ web3, lastBlock, BLOCKS_IN_PARALLEL ]
    const $txs = await withRetry(fetchTxs, args)()

    txs.push(...$txs)
    lastBlock -= BLOCKS_IN_PARALLEL
  }

  return txs.slice(0, limit)
}


/* :: () -> Promise<void> */
const updateLatestTxCache = web3 => async () => {
  try {
    const [ newestTx ] = latestTxs.retrieve()
    const { blockNumber: lastBlockInCache } = newestTx
    const lastBlock = await web3.eth.getBlockNumber()

    /** Nothing to update */
    if (lastBlock === lastBlockInCache) {
      return
    }

    const blocksToCheck = lastBlock - lastBlockInCache
    const txs = await fetchTxs(web3, lastBlock, blocksToCheck)

    txs.reverse().forEach((tx) => latestTxs.push(tx))
  } catch (e) {
    console.error('Error trying to update latest Transactions cache.')
  }
}


/* :: () -> Promise<void> */
const setup = async (web3) => {
  const txs = await withRetry(getLatestTransactions, [ web3, MAX_TXS ])()
  txs.reverse().forEach((tx) => latestTxs.push(tx))

  setInterval(updateLatestTxCache(web3), 1500)
}


/* :: () -> object[] */
const getTransactions = (limit = 10) =>
  latestTxs.retrieve(Math.min(limit, MAX_TXS))


module.exports = {
  setup,
  getTransactions
}
