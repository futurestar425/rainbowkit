import { Connector } from 'wagmi';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { isHexString } from '../utils/colors';
import { isMobile } from '../utils/isMobile';
import { omitUndefinedValues } from '../utils/omitUndefinedValues';
import { Wallet, WalletInstance, WalletList } from './Wallet';

interface WalletListItem extends Wallet {
  index: number;
  groupIndex: number;
  groupName: string;
}

/*
  Build your own list of wallets for the RainbowKit modal
  with their necessary connectors. This way you have full
  control over which wallets to display, and in which order.
  Returns a `connectors` fn to pass directly to Wagmi's `createConfig`. 
*/
export function connectorsForWallets(walletList: WalletList): () => Connector[];

/*
  Assemble a list of low-level connectors for use with the
  `WalletButton` and `RainbowButton` components in custom implementations.
*/
export function connectorsForWallets(wallets: Wallet[]): Connector[];

/*
  Overload implementation for `connectorsForWallets`.
  1. Returns a `connectors` function that will then return a Connectors array
  2. Returns a prepared Connectors array stuffed with dummy WalletList data
*/
export function connectorsForWallets(walletList: any): any {
  if ('groupName' in walletList[0]) {
    return _connectorsForWallets(walletList);
  }
  return _connectorsForWallets([
    {
      groupName: '',
      wallets: walletList as Wallet[],
    },
  ])();
}

const _connectorsForWallets = (walletList: WalletList): (() => Connector[]) => {
  return () => {
    let index = -1;

    const connectors: Connector[] = [];
    const visibleWallets: WalletListItem[] = [];
    const potentiallyHiddenWallets: WalletListItem[] = [];
    const walletInstances: WalletInstance[] = [];

    // First collect all list items in the correct order, but keep
    // track of which ones have a `hidden` function so we can
    // evaluate them after all the visible wallet instances have
    // been created. This is because the potentially hidden wallets
    // need access to the list of resolved wallet instances so that
    // they can decide whether or not they should be hidden,
    // e.g. the "Injected Wallet" option hides itself if another
    // injected wallet is available.
    // biome-ignore lint/complexity/noForEach: TODO
    walletList.forEach(({ groupName, wallets }, groupIndex) => {
      // biome-ignore lint/complexity/noForEach: TODO
      wallets.forEach((wallet) => {
        index++;

        // guard against non-hex values for `iconAccent`
        if (wallet?.iconAccent && !isHexString(wallet?.iconAccent)) {
          throw new Error(
            `Property \`iconAccent\` is not a hex value for wallet: ${wallet.name}`,
          );
        }

        const walletListItem = {
          ...wallet,
          groupIndex,
          groupName,
          index,
        };

        if (typeof wallet.hidden === 'function') {
          potentiallyHiddenWallets.push(walletListItem);
        } else {
          visibleWallets.push(walletListItem);
        }
      });
    });

    // We process the known visible wallets first so that the potentially
    // hidden wallets have access to the complete list of resolved wallets
    const walletListItems: WalletListItem[] = [
      ...visibleWallets,
      ...potentiallyHiddenWallets,
    ];

    // biome-ignore lint/complexity/noForEach: TODO
    walletListItems.forEach(
      ({
        createConnector,
        groupIndex,
        groupName,
        hidden,
        index,
        ...walletMeta
      }) => {
        if (typeof hidden === 'function') {
          // Run the function to check if the wallet needs to be hidden
          const isHidden = hidden({
            wallets: [
              // Note: We only expose a subset of fields
              // publicly to reduce API surface area
              ...walletInstances.map(({ connector, id, installed, name }) => ({
                connector,
                id,
                installed,
                name,
              })),
            ],
          });

          // If wallet is hidden, bail out and proceed to the next list item
          if (isHidden) {
            return;
          }
        }

        const { connector, ...connectionMethods } = omitUndefinedValues(
          createConnector(),
        );

        let walletConnectModalConnector: Connector | undefined;
        if (
          walletMeta.id === 'walletConnect' &&
          connectionMethods.qrCode &&
          !isMobile()
        ) {
          const { chains, options } = connector;

          walletConnectModalConnector = new WalletConnectConnector({
            chains,
            options: {
              ...options,
              showQrModal: true,
            },
          });

          connectors.push(walletConnectModalConnector);
        }

        const walletInstance: WalletInstance = {
          connector,
          groupIndex,
          groupName,
          index,
          walletConnectModalConnector,
          ...walletMeta,
          ...connectionMethods,
        };

        // We maintain an array of all wallet instances
        // so they can be passed to the `hidden` function
        // used by generic fallback wallets
        walletInstances.push(walletInstance);

        if (!connectors.includes(connector)) {
          connectors.push(connector);

          // Reset private wallet list the first time we see
          // a connector to avoid duplicates after HMR,
          // otherwise we'll keep pushing wallets into
          // the old list. This is happening because we're
          // re-using the WalletConnectConnector instance
          // so the wallet list already exists after HMR.
          connector._wallets = [];
        }

        // Add wallet to connector's list of associated wallets
        connector._wallets.push(walletInstance);
      },
    );

    return connectors;
  };
};
