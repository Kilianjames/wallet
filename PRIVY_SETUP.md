# Privy Wallet Setup Instructions

## The Connect Wallet button is not working because you need a valid Privy App ID.

### Steps to Get Your Privy App ID:

1. **Go to Privy Dashboard**
   - Visit: https://dashboard.privy.io
   - Sign up or log in

2. **Create a New App**
   - Click "Create App"
   - Name it "Polynator" or your preferred name
   - Select your configuration

3. **Configure Wallet Support**
   - Enable **Solana** wallets (Phantom, Solflare, Backpack)
   - Enable **Polygon** (for Polymarket)
   - Enable Email/SMS login (optional)

4. **Get Your App ID**
   - Copy your App ID from the dashboard
   - It looks like: `clpqf1xxt00ycl80fpueukv8w`

5. **Update Your Environment**
   ```bash
   # Edit /app/frontend/.env
   REACT_APP_PRIVY_APP_ID=your-actual-privy-app-id-here
   ```

6. **Restart Frontend**
   ```bash
   sudo supervisorctl restart frontend
   ```

## Current Configuration

The app is configured to support:
- ✅ Solana wallets (Phantom, Solflare, Backpack)
- ✅ Polygon network (for Polymarket trading)
- ✅ Email/SMS login
- ✅ Embedded wallets

## Testing After Setup

1. Click "Connect Wallet" button
2. You should see Privy modal with wallet options
3. Connect with Phantom or other Solana wallet
4. Your address will show in the navbar
5. Portfolio page will unlock

## Alternative: Test Mode

The default App ID (`clz3o9t2b02o63b1s14k85nty`) is for testing only and may not work properly. You MUST use your own App ID for production.

## Need Help?

If you have issues:
1. Check browser console for errors (F12)
2. Verify App ID is correct in `.env`
3. Make sure you restarted frontend after changing `.env`
4. Check Privy dashboard for app configuration

---

**Note:** Privy is free for development. Get started at https://privy.io
