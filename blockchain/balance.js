/** Return a dictionary of public keys and balances */
function getAllBalances (blocks) {
  const balances = {}

  for (let block of blocks) {
    const { miner, difficulty, transaction } = block
    const { recipient, sender, amount } = transaction
    balances[miner] = balances[miner] ? balances[miner] + difficulty : difficulty
    balances[recipient] = balances[recipient] ? balances[recipient] + amount : amount
    balances[sender] = balances[sender] ? balances[sender] - amount : amount * -1
  }

  return balances
}

/** Get current balance for provided wallet key */
function getBalance (publicKey, blocks) {
  const minedValues = getMinedBlocks(publicKey, blocks).map(block => block.difficulty)
  const debitValues = getDebits(publicKey, blocks).map(transaction => transaction.amount * -1)
  const creditValues = getCredits(publicKey, blocks).map(transaction => transaction.amount)
  return [...minedValues, ...debitValues, ...creditValues].reduce((prev, current) => prev + current, 0)
}

/** Return all blocks mined by the public key */
function getMinedBlocks (publicKey, blocks) {
  return blocks.filter(block => block.miner === publicKey)
}

/** Return all transaction objects within the blockchain */
function getAllTransactions (blocks) {
  return blocks.map(block => block.transaction)
}

/** Get all debits (sent payments) for a public key */
function getDebits (publicKey, blocks) {
  return getAllTransactions(blocks).filter(transaction => transaction.sender === publicKey)
}

/** Get all credits (received payments) for a public key */
function getCredits (publicKey, blocks) {
  return getAllTransactions(blocks).filter(transaction => transaction.recipient === publicKey)
}

module.exports = {
  getAllBalances,
  getBalance,
  getMinedBlocks,
  getAllTransactions,
  getDebits,
  getCredits
}
