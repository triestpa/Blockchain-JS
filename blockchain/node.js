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
    // Calculate total difficultly of each chain
    const currentDifficultySum = this.getBlocks().reduce((prev, current) => prev + current.difficulty, 0)
    const newDifficultySum = blocks.reduce((prev, current) => prev + current.difficulty, 0)

    // Take chain with highest difficulty
    if (currentDifficultySum < newDifficultySum) {
      if (this.getBlocks().first().getHash() !== blocks.first().getHash()) {
        throw new Error('Genesis Block Does Not Match')
      }

      validation.validateChain(blocks)

      this.blockchain = new Blockchain(blocks, this.difficulty)
    }
  }

  /** Shortcut to generate coins for wallet, by mining a bunch of zero-payment blocks to self */
  mine (amount) {
    for (let i = 0; i < amount; i++) {
      this.pay(this.wallet.publicKey, 0)
    }
  }

  /** Pay a recipient with the current wallet */
  pay (recipient, amount) {
    const transaction = new Transaction(this.wallet.publicKey, recipient, amount)
    const signature = this.wallet.generateSignature(transaction)
    transaction.sign(signature)
    this.blockchain.addBlock(transaction, this.wallet.publicKey)
  }

  /** Return stored blockchain blocks */
  getBlocks () { return this.blockchain.blocks }

  /** Get the balance for the current wallet */
  getBalance () { return balance.getBalance(this.wallet.publicKey, this.getBlocks()) }
}

module.exports = BlockChainNode
