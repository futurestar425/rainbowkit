import { useAccount } from 'wagmi';
import { useAuthenticationStatus } from '../components/RainbowKitProvider/AuthenticationContext';
import { useDisconnect } from './useDisconnect';

export type ConnectionStatus =
  | 'disconnected'
  | 'loading'
  | 'unauthenticated'
  | 'connected';

export function useConnectionStatus(): ConnectionStatus {
  const authenticationStatus = useAuthenticationStatus();
  const { status: connectorStatus } = useAccount();
  const { status: disconnectStatus } = useDisconnect();

  if (connectorStatus === 'connecting' || connectorStatus === 'reconnecting') {
    return 'loading';
  }

  if (
    connectorStatus === 'disconnected' ||
    disconnectStatus === 'pending' ||
    disconnectStatus === 'success'
  ) {
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
