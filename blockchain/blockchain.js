const immutable = require('immutable')
const Block = require('./block')
const Transaction = require('./transaction')

class Blockchain {
  /** Create a new blockchain, or restore from existing blocks */
  constructor (blocks = null, difficulty = 3) {
    this.difficulty = difficulty

    if (blocks) {
      this.blocks = immutable.List(blocks)
    } else {
      this.blocks = immutable.List([ this.createGenesisBlock() ])
    }
  }

  /** Create first block in chain */
  createGenesisBlock () {
    const genesisTransaction = new Transaction('genesis', 'genesis', 0)
    return new Block(0, 'genesis', genesisTransaction)
  }

  /** Generate, mine, validate, and add a new block for this transaction */
  addBlock (transaction, miner) {
    const previousBlock = this.blocks.last()
    const index = previousBlock.index + 1
    const newBlock = new Block(index, previousBlock.getHash(), transaction)
    newBlock.mine(this.difficulty, miner)
    this.blocks = this.blocks.push(newBlock)
  }
}

module.exports = Blockchain
