# Alpha Alerts V2: brand and Solana support
- Owner Lane Flow, subscriber intelligence, and Alpha Command use the existing
  `/alpha-lane-v4-logo.png`, Sora wordmark, and gold ALPHA ALERTS typography.
- Public receiving key: `EmZrEA6awqWqo5pzbwX3ZRpyE9sNT42LZ6LBvU6bM4M5`.
  Base58-decoded length is 32 bytes (syntactically valid Solana public key).
  Supports showing one receiving address for native SOL and Solana-network
  USDC SPL transfers, subject to wallet owner and token-account verification.
- Override with NEXT_PUBLIC_SUPPORT_SOLANA_ADDRESS. The current
  NEXT_PUBLIC_SUPPORT_CRYPTO_ENABLED=true release gate is NOT bypassed.
  No production payment collection was activated. Transfers are irreversible;
  sending USDC on other networks is unsupported.
