import { useAccount } from 'wagmi';
import { useAuthenticationStatus } from '../components/RainbowKitProvider/AuthenticationContext';

export type ConnectionStatus =
  | 'disconnected'
  | 'loading'
  | 'unauthenticated'
  | 'connected';

export function useConnectionStatus(): ConnectionStatus {
  const authenticationStatus = useAuthenticationStatus();
  const { status: connectorStatus } = useAccount();

  if (connectorStatus === 'connecting' || connectorStatus === 'reconnecting') {
    return 'loading';
  }

  if (connectorStatus === 'disconnected') {
    return 'disconnected';
  }

  if (!authenticationStatus) {
    return 'connected';
  }

  if (
    authenticationStatus === 'loading' ||
    authenticationStatus === 'unauthenticated'
  ) {
    return authenticationStatus;
  }

  return 'connected';
}
