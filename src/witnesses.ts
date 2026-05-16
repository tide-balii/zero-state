import { Witnesses, Ledger } from './managed/whitelist/contract/index.js';
import { WitnessContext } from '@midnight-ntwrk/compact-runtime';

/**
 * Our local private state. This is data that the prover has access to,
 * but is never sent to the network or disclosed in the transaction.
 */
export type WhitelistPrivateState = {
  secretKey: Uint8Array;
};

/**
 * Creates the witness implementations for our Whitelist contract.
 * Witnesses are functions that supply private, off-chain data directly
 * to the Zero-Knowledge circuits running locally on the user's machine.
 */
export const createWhitelistWitnesses = (): Witnesses<WhitelistPrivateState> => ({
  
  // 1. Supplies the secret key from our local state
  local_secret_key: (context: WitnessContext<Ledger, WhitelistPrivateState>): [WhitelistPrivateState, Uint8Array] => {
    return [context.privateState, context.privateState.secretKey];
  },

  // 2. Finds the Merkle path for a given public key in the on-chain tree
  find_whitelist_path: (
    context: WitnessContext<Ledger, WhitelistPrivateState>,
    pk_0: Uint8Array
  ): [WhitelistPrivateState, ReturnType<Witnesses<WhitelistPrivateState>['find_whitelist_path']>[1]] => {
    
    // The Midnight JS runtime provides utilities to query ADTs (like HistoricMerkleTree)
    // findPathForLeaf automatically computes the path from the leaf to the root.
    const path = context.ledger.whitelist.findPathForLeaf(pk_0);
    
    if (!path) {
      throw new Error("Cannot generate proof: Public key is not in the whitelist Merkle Tree.");
    }
    
    return [context.privateState, path];
  }
});
