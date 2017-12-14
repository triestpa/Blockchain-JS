const immutable = require('immutable')
const Block = require('./block')
const Wallet = require('./wallet')
const Transaction = require('./transaction')
const util = require('./util')

class Blockchain {
  /** Create a new blockchain, or restore from existing blocks */
  constructor (blocks = null, difficulty = 3) {
    this.difficulty = difficulty

    if (blocks) {
      this.blocks = immutable.List(blocks)
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
    util.validateNewBlock(newBlock, this.blocks)
    this.blocks = this.blocks.push(newBlock)
  }
}

module.exports = Blockchain
