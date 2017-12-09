const immutable = require('immutable')
const Block = require('./block')
const Wallet = require('./wallet')

class Blockchain {
  /**
   * Create a new blockchain
   * @param { object[] } blocks - Blocks to initialize the chain with
   * @param { number } difficulty - Block mining difficulty
   * @param { number } allowedDebt - The allowed deficit for any wallet
   */
  constructor (blocks, difficulty = 3, allowedDebt = 100) {
    this.difficulty = difficulty
    this.allowedDebt = allowedDebt

    if (blocks) {
      this.blocks = blocks
    } else {
      this.blocks = immutable.List()
      this.createGenesisBlock()
    }
  }

  /** Create first block in chain */
  createGenesisBlock () {
    const firstBlock = new Block(0, 'genesis', new Date().getTime(), 'genesis', 'genesis', 0)
    firstBlock.mine(this.difficulty)
    firstBlock.sign('genesis')
    this.addBlock(firstBlock)
  }

  /** Generate a new block for the chain */
  generateNextBlock (recipient, sender, amount) {
    const previousBlock = this.blocks.last()
    const index = previousBlock.index + 1
    const timestamp = new Date().getTime()
    return new Block(index, previousBlock.hash, timestamp, recipient, sender, amount)
  }

  /** Add a block to the chain */
  addBlock (block) {
    this.blocks = this.blocks.push(block)
  }

  /** Repace this chain with a longer one */
  replaceChain (newChain) {
    if (newChain.validateChain() && newChain.blocks.size > this.blocks.size) {
      console.log('Received blockchain is valid. Replacing current blockchain with received blockchain')
      this.blocks = newChain.blocks
    } else {
      console.log('Received blockchain invalid')
    }
  }

  /** Determine the current chain is valid */
  validateChain () {
    const tmpChain = new Blockchain(null, this.difficulty, this.allowedDebt)
    tmpChain.blocks = immutable.List([ this.blocks.first() ])

    // Recreate the chain, validating new blocks one-by-one
    for (let block of this.blocks.shift()) {
      tmpChain.validateNewBlock(block)
      tmpChain.addBlock(block)
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

    // Block hash must match
    if (blockHash !== block.hash) { throw new Error(`Hash Does Not Match`) }

    // Block hash must contain difficulty mandated prefix
    const solutionPrefix = new Array(this.difficulty).fill('0').join('')
    if (blockHash.slice(0, solutionPrefix.length) !== solutionPrefix) { throw new Error(`Invalid Hash - ${blockHash}`) }

    // Sender must have available balance for transaction
    const walletBalance = this.getBalance(block.sender) - block.amount + this.allowedDebt
    if (walletBalance < 0) { throw new Error(`Insufficient Balance - ${walletBalance} - Block ${block.index}`) }

    // Signature must be valid
    try {
      Wallet.verifySignature(block.sender, block.signature, block.hash)
    } catch (err) { throw new Error('Invalid Signature', err) }

    return true
  }

  /** Return an object with all wallet balances */
  getAllBalances () {
    return this.localChain.blocks.reduce((prev, current) => {
      prev[current.sender] = prev[current.sender] ? prev[current.sender] - current.amount : current.amount * -1
      prev[current.recipient] = prev[current.recipient] ? prev[current.recipient] + current.amount : current.amount
      return prev
    }, {})
  }

  /** Get current balance for provided wallet key */
  getBalance (publicKey) {
    const debits = this.blocks.filter(block => block.sender === publicKey).map(block => block.amount * -1)
    const credits = this.blocks.filter(block => block.recipient === publicKey).map(block => block.amount)
    return debits.concat(credits).reduce((prev, current) => prev + current)
  }
}

module.exports = Blockchain
