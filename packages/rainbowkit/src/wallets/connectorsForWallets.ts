import type { CreateConnectorFn } from 'wagmi';
import { isHexString } from '../utils/colors';
import { isMobile } from '../utils/isMobile';
import { omitUndefinedValues } from '../utils/omitUndefinedValues';
import type {
  RainbowKitWalletConnectParameters,
  Wallet,
  WalletDetailsParams,
  WalletList,
} from './Wallet';
import { computeWalletConnectMetaData } from './computeWalletConnectMetaData';
import { injectedWallet } from './walletConnectors';

interface WalletListItem extends Wallet {
  groupIndex: number;
  groupName: string;
}

export interface ConnectorsForWalletsParameters {
  projectId: string;
  appName: string;
  appDescription?: string;
  appUrl?: string;
  appIcon?: string;
  walletConnectParameters?: RainbowKitWalletConnectParameters;
}

export const connectorsForWallets = (
  walletList: WalletList,
  {
    projectId,
    walletConnectParameters,
    appName,
    appDescription,
    appUrl,
    appIcon,
  }: ConnectorsForWalletsParameters,
): CreateConnectorFn[] => {
  const connectors: CreateConnectorFn[] = [];
  const visibleWallets: WalletListItem[] = [];
  const potentiallyHiddenWallets: WalletListItem[] = [];

  const mobile = isMobile();

  const walletConnectMetaData = computeWalletConnectMetaData({
    appName,
    appDescription,
    appUrl,
    appIcon,
  });

  // biome-ignore lint/complexity/noForEach: TODO
  walletList.forEach(({ groupName, wallets }, groupIndex) => {
    // biome-ignore lint/complexity/noForEach: TODO
    wallets.forEach((createWallet) => {
      const wallet = createWallet({
        projectId,
        appName,
        appIcon,
        // `option` is being used only for `walletConnectWallet` wallet
        options: {
          metadata: walletConnectMetaData,
          ...walletConnectParameters,
        },
        // Every other wallet that supports walletConnect flow and is not
        // `walletConnectWallet` wallet will have `walletConnectParameters` property
        walletConnectParameters: {
          metadata: walletConnectMetaData,
          ...walletConnectParameters,
        },
      });

      // guard against non-hex values for `iconAccent`
      if (wallet?.iconAccent && !isHexString(wallet?.iconAccent)) {
        throw new Error(
          `Property \`iconAccent\` is not a hex value for wallet: ${wallet.name}`,
        );
      }

      const walletListItem = {
        ...wallet,
        groupIndex: groupIndex + 1,
        groupName,
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
  let walletListItems: WalletListItem[] = [
    ...visibleWallets,
    ...potentiallyHiddenWallets,
  ];

  // If you use a browser wallet, we add the injectedWallet to the wallet list
  // if you haven't added one yet. This would avoid using WalletConnect when
  // not needed and only use built in injected provider (window.ethereum)
  if (mobile && typeof window !== 'undefined' && window.ethereum) {
    const isInjectedWalletIncluded = walletListItems.some(
      (walletItem) => walletItem.id === 'injected',
    );

    if (!isInjectedWalletIncluded) {
      const injectedItem = {
        ...injectedWallet(),
        groupName: 'Installed',
        groupIndex: 0,
      };

      walletListItems = [injectedItem, ...walletListItems];
    }
  }

  for (const {
    createConnector,
    groupIndex,
    groupName,
    hidden,
    ...walletMeta
  } of walletListItems) {
    if (typeof hidden === 'function') {
      // Run the function to check if the wallet needs to be hidden
      const isHidden = hidden();

      // If wallet is hidden, bail out and proceed to the next list item
      if (isHidden) {
        continue;
      }
    }

    const walletMetaData = (
      // For now we should only use these as the additional parameters
      additionalRkParams?: Pick<
        WalletDetailsParams['rkDetails'],
        'isWalletConnectModalConnector' | 'showQrModal'
      >,
    ) => {
      return {
        rkDetails: omitUndefinedValues({
          ...walletMeta,
          groupIndex,
          groupName,
          isRainbowKitConnector: true,
          // These additional params will be used in rainbowkit react tree to
          // merge `walletConnectWallet` and `walletConnect` connector from wagmi with
          // showQrModal: true. This way we can let the user choose if they want to
          // connect via QR code or open the official walletConnect modal instead
          ...(additionalRkParams ? additionalRkParams : {}),
        }),
      };
    };

    const isWalletConnectConnector = walletMeta.id === 'walletConnect';

    if (isWalletConnectConnector) {
      connectors.push(
        createConnector(
          walletMetaData({
            isWalletConnectModalConnector: true,
            showQrModal: true,
          }),
        ),
      );
    }

    const connector = createConnector(walletMetaData());

    connectors.push(connector);
  }

  return [...connectors];
};
