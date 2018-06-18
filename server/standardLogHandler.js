'use strict'
const { isUndefined } = require('lodash')

/** [1]. Given a contracts ABI return { [eventSig]: eventABI } */

/* :: (object[], Web3) -> object */
const getEventSigs = (contractABI, web3) => contractABI
  .filter(({ type }) => type === 'event')
  .reduce((sigs, eventABI) => ({ /* [1] */
    ...sigs,
    [web3.eth.abi.encodeEventSignature(eventABI)]: eventABI
  }), {})


/* :: (object[], string, string[], Web3) -> object[] */
const getEventParams = (inputs, data, topics, web3) => {
  const decodedParams = web3.eth.abi.decodeLog(inputs, data, topics.slice(1))
  const params = inputs.map((input, idx) => ({
    ...input,
    value: decodedParams[idx]
  }))

  return params
}

/**
 [1]. Since we know that the transaction is a calling a known contract we can
 get the event name and params using the contract ABI.
 [2]. We do not have the ABI for the given event log. This can occur if contract
 is deploying another contract.
 */

/* :: (object, Array<object>, Web3) -> Array<object> */
const getEventLogs = (eventSigs, logs, web3) => {
  const addInfo = (log) => { /* [1] */
    const [ eventSig ] = log.topics
    const eventABI = eventSigs[eventSig]

    if (isUndefined(eventABI)) { /* [2] */
      return log
    }

    const { name } = eventABI
    const params = eventABI.inputs.length > 0
      ? getEventParams(eventABI.inputs, log.data, log.topics, web3)
      : null

    return { ...log, name, params }
  }

  return logs.map(addInfo)
}

/* :: object -> Array<object> */
const standardLogHandler = ({ tx, web3, abi }) => {
  const sigs = getEventSigs(abi, web3)
  const logs = getEventLogs(sigs, tx.logs, web3)

  return logs
}

module.exports = { standardLogHandler }
