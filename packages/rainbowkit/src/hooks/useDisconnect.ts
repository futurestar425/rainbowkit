import { useMemo } from 'react';
import { useDisconnect as _useDisconnect } from 'wagmi';

export function useDisconnect() {
  const { disconnect: _disconnect, status } = _useDisconnect();
  return useMemo(() => {
    return {
      disconnect: () => _disconnect(),
      status,
    };
  }, [_disconnect, status]);
}
