import { getNetwork } from '@defichain/jellyfish-network'
import { MnemonicHdNodeProvider } from '@defichain/jellyfish-wallet-mnemonic'
import { WhaleApiClient } from '@defichain/whale-api-client'
import { WhaleWalletAccount } from '@defichain/whale-api-wallet'
import { CTransactionSegWit, TransactionSegWit } from '@defichain/jellyfish-transaction'
import BigNumber from 'bignumber.js'

async function main () {
  const words = ['24', 'words', 'mnemonic', 'phrase', 'here']

  // setup client
  const client = initMainnetWhaleClient()

  // ocean compatible light wallet
  const account = initMainnetWallet(client, words)

  // craft transaction and sign
  const me = await account.getScript()
  const transaction = await account.withTransactionBuilder().dex.compositeSwap({
    poolSwap: {
      fromScript: me,
      fromTokenId: 0,
      fromAmount: new BigNumber(0.1),
      toScript: me,
      toTokenId: 1,
      maxPrice: new BigNumber('9223372036854775807')
    },
    pools: []
  }, me)

  // broadcast
  await broadcast(client, transaction)
}

function initMainnetWhaleClient (): WhaleApiClient {
  return new WhaleApiClient({ url: 'https://ocean.defichain.com', network: 'mainnet', version: 'v0' })
}

function initMainnetWallet (client: WhaleApiClient, mnemonic24Words: string[], nodeDerivationPath: string = '0'): WhaleWalletAccount {
  const network = getNetwork('mainnet')
  const hdNodeProvider = MnemonicHdNodeProvider.fromWords(mnemonic24Words, {
    bip32: {
      public: network.bip32.publicPrefix,
      private: network.bip32.privatePrefix
    },
    wif: network.wifPrefix
  })
  const node = hdNodeProvider.derive(nodeDerivationPath)
  return new WhaleWalletAccount(client, node, network)
}

async function broadcast (client: WhaleApiClient, transaction: TransactionSegWit): Promise<void> {
  const hex: string = new CTransactionSegWit(transaction).toHex()
  const txId: string = await client.rawtx.send({ hex: hex })
  console.log('Broadcasted, txid: ', txId)
}

main()
  .then(() => console.log('completed'))
  .catch(e => console.log(e))
