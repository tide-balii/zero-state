import { randomBytes } from 'crypto';
import { Contract, ledger } from './managed/whitelist/contract/index.js';
import { createWhitelistWitnesses, WhitelistPrivateState } from './witnesses.js';
import { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import pino from 'pino';

// Define the shape of our Providers using the standard Midnight JS types
type WhitelistProviders = MidnightProviders<any, any>;

/**
 * Derives a deterministic 32-byte public key from a 32-byte secret key using crypto.
 * In a real application, the DApp would do this using @midnight-ntwrk/crypto
 * to perfectly mirror the Compact `persistentHash`.
 */
function derivePublicKeyLocally(sk: Uint8Array): Uint8Array {
  return new Uint8Array(32).fill(1); // Mock PK
}

/**
 * A mock function showing the flow of how the DApp connects to Midnight.
 * In a real frontend (React/NextJS), 'providers' would be injected by the browser wallet (Lace).
 */
export async function runZeroStateDApp(providers: WhitelistProviders) {
  const logger = pino(pino.transport({ target: 'pino-pretty' }));
  logger.info("Initializing Midnight ZeroState DApp...");

  // 1. Generate or load a local secret key for the user
  const userSecretKey = randomBytes(32);
  
  // Set up the Private State that our Witnesses will read from locally in the Wallet
  const privateState: WhitelistPrivateState = {
    secretKey: userSecretKey
  };

  logger.info("Deploying Whitelist Contract...");
  
  // 2. Deploy the compiled Whitelist contract
  const contractConfig = {
    privateState,
    compiledContract: new Contract(createWhitelistWitnesses()) as any,
  };

  const deployedContract = await deployContract(providers, contractConfig);
  logger.info(`Contract deployed at address: ${deployedContract.deployTxData.public.contractAddress}`);

  // 3. Client-side Interaction: Adding a user to the whitelist
  const publicKey = derivePublicKeyLocally(userSecretKey);
  logger.info("Submitting transaction to add User to Whitelist...");
  
  // Call the generated add_to_whitelist circuit from index.d.ts
  await deployedContract.callTx.add_to_whitelist(publicKey);
  logger.info(`User added to whitelist successfully.`);

  // 4. Client-side Interaction: ZK Proof Verification
  logger.info("Generating ZK Proof of Membership...");
  
  try {
    // The SDK executes the witnesses, grabs the private key,
    // looks up the Merkle path from the indexer, runs the prover locally,
    // and sends ONLY the ZK proof to the network.
    await deployedContract.callTx.verify_whitelist_membership();
    logger.info(`Membership verified successfully via ZK Proof!`);
    
    // Check the updated Verification Count on the public ledger
    const state = await providers.publicDataProvider.queryContractState(deployedContract.deployTxData.public.contractAddress);
    const count = ledger(state!.data).verification_count;
    logger.info(`Total verifiable sign-ins: ${count}`);

  } catch (err) {
    logger.error("Verification failed! (Expected if Merkle Path or Nullifier is invalid)");
  }
}

console.log("ZeroState DApp Boilerplate is ready to be connected to a frontend wallet!");
