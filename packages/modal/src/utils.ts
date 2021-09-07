import { AbstractConnector } from '@web3-react/abstract-connector'
import { Wallet } from '@rainbowkit/utils'
import { chainNametoID, connectorByWallet } from '@rainbowkit/utils'
import metamask from '../assets/icons/metamask.png'
import coinbase from '../assets/icons/coinbase.png'
import frame from '../assets/icons/frame.png'
import assert from 'assert'

/**
 *
 * @param mod in PascalCase
 * @returns
 */
export const importConnector = async (mod: string): Promise<any> => {
  const x = await import(`@web3-react/${mod.toLowerCase()}-connector/dist/${mod.toLowerCase()}-connector.esm.js`)

  return x[`${mod}Connector`]
}

/**
 * Imports and creates a connector with given options
 */
export const createConnector = async ({ name, options, chains }: Wallet & { chains?: (string | number)[] }) => {
  const connectorName = connectorByWallet(name)

  assert.notEqual(connectorName, undefined, `Could not find connector for ${name}`)

  const Connector = await importConnector(connectorName)
  const instance = new Connector({
    ...options,
    supportedChainIds: chains.map((chain) => (typeof chain === 'string' ? chainNametoID(chain) : chain))
  }) as AbstractConnector

  return { instance, name }
}

export const getIcon = (name: string) => {
  switch (name) {
    case 'metamask':
      return metamask
    case 'coinbase':
    case 'walletlink':
      return coinbase
    case 'frame':
      return frame
  }
}
