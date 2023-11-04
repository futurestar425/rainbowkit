import { Wallet } from "../../Wallet";
import { getDefaultInjectedConnector } from "../../getInjectedConnector";

export const rabbyWallet = (): Wallet => ({
  id: "rabby",
  name: "Rabby Wallet",
  iconUrl: async () => (await import("./rabbyWallet.svg")).default,
  iconBackground: "#8697FF",
  installed:
    typeof window !== "undefined" &&
    typeof window.ethereum !== "undefined" &&
    window.ethereum.isRabby === true,
  downloadUrls: {
    chrome:
      "https://chrome.google.com/webstore/detail/rabby-wallet/acmacodkjbdgmoleebolmdjonilkdbch",
    browserExtension: "https://rabby.io",
  },
  extension: {
    instructions: {
      learnMoreUrl: "https://rabby.io/",
      steps: [
        {
          description: "wallet_connectors.rabby.extension.step1.description",
          step: "install",
          title: "wallet_connectors.rabby.extension.step1.title",
        },
        {
          description: "wallet_connectors.rabby.extension.step2.description",
          step: "create",
          title: "wallet_connectors.rabby.extension.step2.title",
        },
        {
          description: "wallet_connectors.rabby.extension.step3.description",
          step: "refresh",
          title: "wallet_connectors.rabby.extension.step3.title",
        },
      ],
    },
  },
  createConnector: () => {
    return getDefaultInjectedConnector();
  },
});
