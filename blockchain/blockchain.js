const immutable = require('immutable')
const Block = require('./block')
const Wallet = require('./wallet')
const Transaction = require('./transaction')

class Blockchain {
  /**
   * Create a new blockchain
   * @param { immutable.List } blocks - Blocks to initialize the chain with
   * @param { number } difficulty - Block mining difficulty
   */
  constructor (blocks, difficulty = 3) {
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

  /** Generate, mine, and add a new block for this transaction */
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

    return true
  }

  /** Determine if a new block is valid */
  validateNewBlock (block) {
    const previousBlock = this.blocks.last()
    const blockHash = block.getHash() // Precompute hash here

    // Indeces must be in order
    if (previousBlock.index + 1 !== block.index) { throw new Error('Invalid Index') }

    // Previous block hash must match
    if (previousBlock.getHash() !== block.previousHash) { throw new Error('Invalid Previous Hash') }

    // Block hash must contain difficulty mandated prefix
    const solutionPrefix = new Array(this.difficulty).fill('0').join('')
    if (blockHash.slice(0, solutionPrefix.length) !== solutionPrefix) { throw new Error(`Invalid Hash - ${blockHash}`) }

    // Transaction must be valid
    this.validateTransaction(block.transaction)

    return true
  }

  validateTransaction (transaction) {
    // Sender must have available balance for transaction
    const walletBalance = this.getBalance(transaction.sender) - transaction.amount
    if (walletBalance < 0) { throw new Error(`Insufficient Balance - ${walletBalance}`) }

    try { // Signature must be valid
      Wallet.verifySignature(transaction.sender, transaction.signature, transaction.getHash())
    } catch (err) { throw new Error('Invalid Signature', err) }
  }

  /** Get current balance for provided wallet key */
  getBalance (publicKey) {
    const minedSum = this.getMinedSum(publicKey)
    const debitSum = this.getDebits(publicKey).map(block => block.amount * -1)
    const creditSum = this.getCredits(publicKey).map(block => block.amount)
    return minedSum + debitSum.concat(creditSum).reduce((prev, current) => prev + current)
  }

  getMinedSum (publicKey) {
    return this.blocks.filter(block => block.miner === publicKey).count()
  }

  getAllTransactions () {
    return this.blocks.map(block => block.transaction)
  }

  getDebits (publicKey) {
    return this.getAllTransactions().filter(transaction => transaction.sender === publicKey)
  }

  getCredits (publicKey) {
    return this.getAllTransactions().filter(transaction => transaction.recipient === publicKey)
  }
}

module.exports = Blockchain
