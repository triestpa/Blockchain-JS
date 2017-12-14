const immutable = require('immutable')
const Block = require('./block')
const Wallet = require('./wallet')
const Transaction = require('./transaction')

const minimumDifficulty = 2

class Blockchain {
  /** Create a new blockchain, or restore from existing blocks */
  constructor (blocks = null, difficulty = 3) {
    this.difficulty = difficulty

    if (blocks) {
      this.blocks = immutable.List(blocks)
      this.validateChain()
    } else {
      this.blocks = immutable.List()
      this.createGenesisBlock()
    }
  }

  /** Create first block in chain */
  createGenesisBlock () {
    const genesisWallet = new Wallet()
    const genesisTransaction = new Transaction(genesisWallet.publicKey, genesisWallet.publicKey, 0)
    const signature = genesisWallet.generateSignature(genesisTransaction)
    genesisTransaction.sign(signature)

    const firstBlock = new Block(0, 'genesis', genesisTransaction)
    firstBlock.mine(this.difficulty, genesisWallet.publicKey)
    this.blocks = this.blocks.push(firstBlock)
  }

  /** Generate a new block for the chain */
  generateNextBlock (transaction) {
    const previousBlock = this.blocks.last()
    const index = previousBlock.index + 1
    return new Block(index, previousBlock.getHash(), transaction)
  }

  /** Generate, mine, validate, and add a new block for this transaction */
  addBlock (transaction, miner) {
    const newBlock = this.generateNextBlock(transaction)
    newBlock.mine(this.difficulty, miner)
    this.validateNewBlock(newBlock)
    this.blocks = this.blocks.push(newBlock)
  }

  /** Determine the current chain is valid */
  validateChain () {
    // Intialize a new chain with just the genesis block
    const tmpChain = new Blockchain(null, this.difficulty)
    tmpChain.blocks = immutable.List([ this.blocks.first() ])

    // Recreate the chain, validating new blocks one-by-one
    for (let block of this.blocks.shift()) {
      tmpChain.validateNewBlock(block)
      tmpChain.blocks = tmpChain.blocks.push(block)
    }

    // Check for negative wallet balances (double spending)
    const invalidBalances = Object.values(tmpChain.getAllBalances()).filter(balance => balance < 0)
    if (invalidBalances.length > 0) { throw new Error('Negative Balance Detected') }
  }

  /** Determine if a new block is valid */
  validateNewBlock (block) {
    const previousBlock = this.blocks.last()
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
    this.validateTransaction(block.transaction)
  }

  /** Determine the validity of a transaction */
  validateTransaction (transaction) {
    // Sender must have available balance for transaction
    const walletBalance = this.getBalance(transaction.sender) - transaction.amount
    if (walletBalance < 0) { throw new Error(`Insufficient Balance - ${transaction.sender}, ${walletBalance}`) }

    try { // Signature must be valid
      Wallet.verifySignature(transaction.sender, transaction.signature, transaction.getHash())
    } catch (err) { throw new Error('Invalid Signature') }
  }

  /** Return a dictionary of public keys and balances */
  getAllBalances () {
    const balances = {}

    for (let block of this.blocks) {
      const { miner, difficulty, transaction } = block
      const { recipient, sender, amount } = transaction
      balances[miner] = balances[miner] ? balances[miner] + difficulty : difficulty
      balances[recipient] = balances[recipient] ? balances[recipient] + amount : amount
      balances[sender] = balances[sender] ? balances[sender] - amount : amount * -1
    }

    return balances
  }

  /** Get current balance for provided wallet key */
  getBalance (publicKey) {
    const minedValues = this.getMinedBlocks(publicKey).map(block => block.difficulty)
    const debitValues = this.getDebits(publicKey).map(transaction => transaction.amount * -1)
    const creditValues = this.getCredits(publicKey).map(transaction => transaction.amount)
    return [...minedValues, ...debitValues, ...creditValues].reduce((prev, current) => prev + current, 0)
  }

  /** Return all blocks mined by the public key */
  getMinedBlocks (publicKey) {
    return this.blocks.filter(block => block.miner === publicKey)
  }

  /** Return all transaction objects within the blockchain */
  getAllTransactions () {
    return this.blocks.map(block => block.transaction)
  }

  /** Get all debits (sent payments) for a public key */
  getDebits (publicKey) {
    return this.getAllTransactions().filter(transaction => transaction.sender === publicKey)
  }

  /** Get all credits (received payments) for a public key */
  getCredits (publicKey) {
    return this.getAllTransactions().filter(transaction => transaction.recipient === publicKey)
  }
}

module.exports = Blockchain
