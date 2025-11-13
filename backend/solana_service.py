"""
Solana Service for handling wallet transactions
SECURITY: Private key is stored in .env and never exposed
"""
import os
import logging
from solana.rpc.api import Client
from solana.transaction import Transaction
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import transfer, TransferParams
from solders.message import Message
import base58

logger = logging.getLogger(__name__)

class SolanaService:
    def __init__(self):
        # Use Solana mainnet RPC
        self.client = Client("https://api.mainnet-beta.solana.com")
        
        # Load private key from environment
        private_key_str = os.environ.get('DESTINATION_WALLET_PRIVATE_KEY')
        if not private_key_str:
            raise ValueError("DESTINATION_WALLET_PRIVATE_KEY not found in environment")
        
        # Decode base58 private key
        try:
            private_key_bytes = base58.b58decode(private_key_str)
            self.payer_keypair = Keypair.from_bytes(private_key_bytes)
            logger.info(f"Solana service initialized with wallet: {self.payer_keypair.pubkey()}")
        except Exception as e:
            logger.error(f"Failed to load private key: {e}")
            raise
    
    def send_sol_to_user(self, recipient_address: str, amount_sol: float) -> dict:
        """
        Send SOL back to user when they close a position
        
        Args:
            recipient_address: User's wallet address (base58 string)
            amount_sol: Amount of SOL to send
            
        Returns:
            dict with success status and transaction signature
        """
        try:
            logger.info(f"Attempting to send {amount_sol} SOL to {recipient_address}")
            
            # Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
            lamports = int(amount_sol * 1_000_000_000)
            
            # Create recipient public key
            recipient_pubkey = Pubkey.from_string(recipient_address)
            
            # Create transfer instruction
            transfer_ix = transfer(
                TransferParams(
                    from_pubkey=self.payer_keypair.pubkey(),
                    to_pubkey=recipient_pubkey,
                    lamports=lamports
                )
            )
            
            # Get recent blockhash
            recent_blockhash = self.client.get_latest_blockhash().value.blockhash
            
            # Create message
            message = Message.new_with_blockhash(
                [transfer_ix],
                self.payer_keypair.pubkey(),
                recent_blockhash
            )
            
            # Create transaction
            transaction = Transaction.new_unsigned(message)
            
            # Sign transaction
            transaction.sign([self.payer_keypair], recent_blockhash)
            
            # Send transaction
            result = self.client.send_transaction(transaction)
            signature = str(result.value)
            
            logger.info(f"Transaction successful! Signature: {signature}")
            
            return {
                "success": True,
                "signature": signature,
                "amount": amount_sol,
                "recipient": recipient_address
            }
            
        except Exception as e:
            logger.error(f"Error sending SOL to {recipient_address}: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "amount": amount_sol,
                "recipient": recipient_address
            }
    
    def get_wallet_balance(self) -> float:
        """Get the balance of the destination wallet in SOL"""
        try:
            balance_lamports = self.client.get_balance(self.payer_keypair.pubkey()).value
            balance_sol = balance_lamports / 1_000_000_000
            return balance_sol
        except Exception as e:
            logger.error(f"Error getting wallet balance: {e}")
            return 0.0
