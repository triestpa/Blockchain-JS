const Wallet = require('./wallet')
const Transaction = require('./transaction')
const Blockchain = require('./blockchain')
const balance = require('./balance')
const validation = require('./validation')

class BlockChainNode {
  /** Initialize a new blockchain node */
  constructor (wallet, difficulty = 4, blocks = null) {
    this.id = Math.random() * 100000
    this.difficulty = difficulty
    this.blockchain = new Blockchain(blocks, difficulty)
    this.wallet = wallet || new Wallet()
  }

  /** Replace current blockchain with new one, if sum difficulty is higher in new chain. */
  sync (blocks) {
    // Check if the incoming blockchain is valid
    validation.validateChain(blocks)

    // Calculate total difficultly of each chain
    const currentDifficultySum = this.getBlocks().reduce((prev, current) => prev + current.difficulty, 0)
    const newDifficultySum = blocks.reduce((prev, current) => prev + current.difficulty, 0)

    // Take chain with highest difficulty
    if (currentDifficultySum < newDifficultySum) {
      if (this.getBlocks().first().getHash() !== blocks.first().getHash()) {
        throw new Error('Genesis Block Does Not Match')
      }

      this.blockchain = new Blockchain(blocks, this.difficulty)
    }
  }

  /** Generate coins for wallet, by mining a bunch of zero-payment blocks to self */
  generateCoins (amount) {
    const iterations = Math.ceil(amount / this.difficulty)
    for (let i = 0; i < iterations; i++) {
      this.pay(this.wallet.publicKey, 0)
    }

    return iterations
  }

  /** Pay a recipient with the current wallet */
  pay (recipient, amount) {
    const transaction = new Transaction(this.wallet.publicKey, recipient, amount)
    transaction.sign(this.wallet)
    this.blockchain.addBlock(transaction, this.wallet.publicKey)
  }

  /** Return stored blockchain blocks */
  getBlocks () { return this.blockchain.blocks }

  /** Get the balance for the current wallet */
  getBalance () { return balance.getBalance(this.wallet.publicKey, this.getBlocks()) }
}

module.exports = BlockChainNode
