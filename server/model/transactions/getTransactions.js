'use strict'
const { times, flatten, get } = require('lodash')
const createFixedStack = require('../../utils/createFixedStack')
const timeout = require('../../utils/timeout')

/** Total number of blocks to search Transactions in parallel */
const BLOCKS_IN_PARALLEL = 100
const MAX_TXS = 100

/** Transactions Cache. Index 0 is newest Transaction */
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
    try {
      const $txs = await fetchTxs(web3, lastBlock, BLOCKS_IN_PARALLEL)
      txs.push(...$txs)
      lastBlock -= BLOCKS_IN_PARALLEL
    } catch (e) {
      /** @TODO: make this increasing on attempts to a MAX value */
      await timeout(2500)
      continue
    }
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
  try {
    const txs = await getLatestTransactions(web3, MAX_TXS)
    txs.reverse().forEach((tx) => latestTxs.push(tx))

    setInterval(updateLatestTxCache(web3), 1500)
  } catch (e) {
    console.error('Error fethcing initial latest transactions')
  }
}


/* :: () -> object[] */
const getTransactions = (limit = 10) =>
  latestTxs.retrieve(Math.min(limit, MAX_TXS))


module.exports = {
  setup,
  getTransactions
}
