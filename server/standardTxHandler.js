'use strict'
const { isNil, first, pickBy } = require('lodash')
const abiDecoder = require('abi-decoder')
const getNetworkConfig = require('./getNetworkConfig')
const { standardLogHandler } = require('./standardLogHandler')

/* :: (object, string) -> ?object */
const getContractInfo = (contracts, address) => {
  const hasAddress = ({ deployments = [] }) =>
    deployments.some(deployment => address === deployment.address)
  const contract = pickBy(contracts, hasAddress)

  return first(Object.values(contract))
}


/**
 [1]. Check if the transaction is for a known contract.
 [2]. @TODO: Remove this after refactoring the client. `toName` field can be part
 of `to` field.
 */

/* :: object -> object */
const standardTxHandler = async ({ networkConfigPath, tx, web3 }) => {
  const { contracts } = await getNetworkConfig(networkConfigPath)
  const contractInfo = getContractInfo(contracts, tx.to) /* [1] */

  if (isNil(contractInfo)) {
    return tx
  }

  abiDecoder.addABI(contractInfo.abi)

  const { params, name: method } = abiDecoder.decodeMethod(tx.input)
  const logs = await standardLogHandler({
    tx,
    web3,
    abi: contractInfo.abi
  })

  const txWithExtraInfo = {
    ...tx,
    logs,
    method,
    params,
    enhanced: true, /* [2] */
    toName: contractInfo.name /* [2] */
  }

  return txWithExtraInfo
}

module.exports = { standardTxHandler }
