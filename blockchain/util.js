const sjcl = require('sjcl/core.js')
const immutable = require('immutable')

/** Determine the current chain is valid */
function validateChain (blocks) {
  // Intialize a new chain with just the genesis block
  const tmpChain = immutable.List([ blocks.first() ])

  // Recreate the chain, validating new blocks one-by-one
  for (let block of tmpChain.shift()) {
    validateNewBlock(block, tmpChain)
    tmpChain.blocks = tmpChain.blocks.push(block)
  }

  // Check for negative wallet balances (double spending)
  const invalidBalances = Object.values(getAllBalances(blocks)).filter(balance => balance < 0)
  if (invalidBalances.length > 0) { throw new Error('Negative Balance Detected') }
}

/** Determine if a new block is valid */
function validateNewBlock (block, currentBlocks, minimumDifficulty = 2) {
  const previousBlock = currentBlocks.last()
  const blockHash = block.getHash()

  // Indeces must be in order
  if (previousBlock.index + 1 !== block.index) { throw new Error('Invalid Index') }

  // Previous block hash must match
  if (previousBlock.getHash() !== block.previousHash) { throw new Error('Invalid Previous Hash') }

  // Verify that difficulty is high enough
  if (block.difficulty < minimumDifficulty) { throw new Error('Difficult is too low') }

  // Block hash must contain difficulty mandated prefix
  const solutionPrefix = new Array(block.difficulty).fill('0').join('')
  if (blockHash.slice(0, solutionPrefix.length) !== solutionPrefix) { throw new Error(`Invalid Hash - ${blockHash}`) }

  // Transaction must be valid
  validateTransaction(block.transaction, currentBlocks)
}

/** Determine the validity of a transaction */
function validateTransaction (transaction, currentBlocks) {
  // Sender must have available balance for transaction
  const walletBalance = getBalance(transaction.sender, currentBlocks) - transaction.amount
  if (walletBalance < 0) { throw new Error(`Insufficient Balance - ${transaction.sender}, ${walletBalance}`) }

  try { // Signature must be valid
    verifySignature(transaction.sender, transaction.signature, transaction.getHash())
  } catch (err) { throw new Error('Invalid Signature') }
}

/** Verify the validity of a block signature */
function verifySignature (publicKey, signature, hash) {
  // De-serialize the public key
  publicKey = new sjcl.ecc.ecdsa.publicKey(
    sjcl.ecc.curves.k256,
    sjcl.codec.base64.toBits(publicKey)
  )

  // De-serialize the signature
  signature = sjcl.codec.hex.toBits(signature)

  // Verify that the block hash was signed with the specified key
  publicKey.verify(hash, signature)
}

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
  validateNewBlock,
  validateTransaction,
  getAllBalances,
  getBalance,
  getMinedBlocks,
  getAllTransactions,
  getDebits,
  getCredits,
  verifySignature,
  validateChain
}
