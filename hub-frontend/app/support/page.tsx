"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Beer, Check, Copy, CreditCard, ExternalLink, Heart, LockKeyhole, Wallet } from "lucide-react";
import styles from "./support.module.css";

type Amount = 3 | 5 | 10;
type SupportSelection = Amount | "custom";
type Currency = "SOL" | "USDC";

const STRIPE_URLS: Record<Amount, string> = {
  3: process.env.NEXT_PUBLIC_SUPPORT_STRIPE_3_URL ?? "",
  5: process.env.NEXT_PUBLIC_SUPPORT_STRIPE_5_URL ?? "",
  10: process.env.NEXT_PUBLIC_SUPPORT_STRIPE_10_URL ?? "",
};
const STRIPE_CUSTOM_URL = process.env.NEXT_PUBLIC_SUPPORT_STRIPE_CUSTOM_URL ?? "";
const SOLANA_ADDRESS = (process.env.NEXT_PUBLIC_SUPPORT_SOLANA_ADDRESS ?? "").trim();
const AMOUNTS: readonly { value: Amount; name: string }[] = [
  { value: 3, name: "A SIP" },
  { value: 5, name: "A BEER" },
  { value: 10, name: "A ROUND" },
];

function validStripeLink(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.hostname !== "buy.stripe.com" || url.pathname === "/" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function validSolanaAddress(raw: string): boolean {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(raw) || /^1+$/.test(raw)) return false;
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let number = BigInt(0);
  for (const letter of raw) {
    const digit = alphabet.indexOf(letter);
    if (digit < 0) return false;
    number = number * BigInt(58) + BigInt(digit);
  }
  let count = 0;
  while (number > BigInt(0)) {
    count++;
    number >>= BigInt(8);
  }
  return count + (raw.match(/^1*/)?.[0]?.length ?? 0) === 32;
}

const DEFAULT_AMOUNT: SupportSelection = validStripeLink(STRIPE_URLS[5]) ? 5 : validStripeLink(STRIPE_URLS[3]) ? 3 : validStripeLink(STRIPE_URLS[10]) ? 10 : validStripeLink(STRIPE_CUSTOM_URL) ? "custom" : 5;

export default function FruxLabsSupportPage() {
  const [amount, setAmount] = useState<SupportSelection>(DEFAULT_AMOUNT);
  const [currency, setCurrency] = useState<Currency>("USDC");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [cryptoOpen, setCryptoOpen] = useState(false);
  const customLink = validStripeLink(STRIPE_CUSTOM_URL);
  const paymentLink = amount === "custom" ? customLink : validStripeLink(STRIPE_URLS[amount]);
  const hasAnyCardLink = Object.values(STRIPE_URLS).some((url) => !!validStripeLink(url)) || !!customLink;
  const cryptoAvailable = validSolanaAddress(SOLANA_ADDRESS);

  async function copyAddress() {
    if (!cryptoAvailable) return;
    try {
      await navigator.clipboard.writeText(SOLANA_ADDRESS);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <div className={styles.page}>
      <nav className={styles.supportNav} aria-label="Support page navigation">
        <span className={styles.siteLabel}>FRUXLABS <span>/ SUPPORT</span></span>
        <Link href="/" className={styles.backLink}>BACK TO ALPHA ALERTS <span aria-hidden="true">↗</span></Link>
      </nav>
      <section className={styles.panel} aria-labelledby="support-title">
        <div className={styles.brand}>
          <svg className={styles.mark} viewBox="0 0 70 64" aria-hidden="true">
            <defs><linearGradient id="frux-support-gold" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#f2daab" /><stop offset="0.53" stopColor="#e7bc67" /><stop offset="1" stopColor="#786236" />
            </linearGradient></defs>
            <path d="M9 12H22L35 39L48 12H61L35 59Z" fill="url(#frux-support-gold)" />
          </svg>
          <p className={styles.eyebrow}>FRUXLABS SOFTWARE</p>
          <h1 id="support-title" className={styles.title}>BUY ME A <span>BEER.</span></h1>
          <p className={styles.intro}>The simplest tools should be the ones you love using.</p>
        </div>

        <div className={styles.divider} />
        <div className={styles.message}>
          <p className={styles.promise}>NO ADS. NO SIGN-UPS. NO BS.</p>
          <p className={styles.detail}>Alpha Apps are free to use. If they make your day a little better, you can support future development. Totally optional. Always appreciated.</p>
        </div>

        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>ONE-TIME SUPPORT</span>
          <span className={styles.sectionHint}>USD · No subscription</span>
        </div>
        <div className={styles.amounts} role="group" aria-label="Choose a support amount">
          {AMOUNTS.map((option) => (
            <button key={option.value} type="button"
              className={[styles.amount, amount === option.value ? styles.amountActive : ""].join(" ")}
              aria-pressed={amount === option.value} onClick={() => setAmount(option.value)}>
              <span className={styles.price}>${option.value}</span>
              <span className={styles.amountLabel}>{option.name}</span>
            </button>
          ))}
          <button type="button"
            className={[styles.amount, amount === "custom" ? styles.amountActive : ""].join(" ")}
            aria-pressed={amount === "custom"} onClick={() => setAmount("custom")}>
            <span className={styles.price}>ANY</span>
            <span className={styles.amountLabel}>CUSTOM</span>
          </button>
        </div>
        {amount === "custom" && (
          <p className={styles.customHint}>Enter any amount you prefer on the secure Stripe checkout page.</p>
        )}

        {paymentLink ? (
          <a className={styles.primary} href={paymentLink} target="_blank" rel="noopener noreferrer">
            <CreditCard size={17} aria-hidden="true" /> {amount === "custom" ? "ENTER YOUR AMOUNT" : `SUPPORT ${amount} BY CARD`} <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : amount !== "custom" && customLink ? (
          <a className={styles.primary} href={customLink} target="_blank" rel="noopener noreferrer">
            <CreditCard size={17} aria-hidden="true" /> CHOOSE YOUR AMOUNT <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : (
          <div className={styles.unavailable} role="status">
            <LockKeyhole size={16} aria-hidden="true" />
            {hasAnyCardLink ? "This support option isn't available yet. Try another amount." : "Card support is being set up. No payments are being collected here yet."}
          </div>
        )}

        <div className={styles.or}><span>OR</span></div>
        <button type="button" className={styles.cryptoToggle}
          aria-expanded={cryptoOpen} aria-controls="crypto-support-details"
          onClick={() => { setCryptoOpen((v) => !v); setCopyStatus("idle"); }}>
          <Wallet size={18} aria-hidden="true" /> SEND SOL OR USDC <span className={styles.toggleGlyph}>{cryptoOpen ? "−" : "+"}</span>
        </button>
        {cryptoOpen && (
          <div id="crypto-support-details" className={styles.cryptoPanel}>
            {cryptoAvailable ? (
              <>
                <div className={styles.assetTabs} role="group" aria-label="Select cryptocurrency">
                  {(["USDC", "SOL"] as const).map((asset) => (
                    <button key={asset} type="button" aria-pressed={currency === asset}
                      className={[styles.assetTab, currency === asset ? styles.assetTabActive : ""].join(" ")}
                      onClick={() => { setCurrency(asset); setCopyStatus("idle"); }}>
                      {asset}
                    </button>
                  ))}
                </div>
                <div className={styles.qrBox}>
                  <QRCodeSVG value={SOLANA_ADDRESS} size={136} bgColor="#ffffff" fgColor="#111113"
                    marginSize={1} title="FruxLabs Solana receiving wallet address" />
                </div>
                <p className={styles.cryptoInstruction}>On the <strong>Solana network</strong>, select <strong>{currency}</strong> in your wallet and enter any amount. Scan the address or copy it below.</p>
                <div className={styles.walletAddress}><code>{SOLANA_ADDRESS}</code></div>
                <button type="button" className={styles.copyButton} onClick={copyAddress}>
                  {copyStatus === "copied" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                  {copyStatus === "copied" ? "ADDRESS COPIED" : "COPY WALLET ADDRESS"}
                </button>
                <p className={styles.copyFeedback} role="status" aria-live="polite">{copyStatus === "copied" ? "Address copied. Confirm the network and recipient before sending." : copyStatus === "failed" ? "Automatic copy failed. Select and copy the address above." : ""}</p>
                <p className={styles.warning}>QR contains the receiving address only; it does not choose the asset or amount for you. Verify the address and network in your wallet. Crypto transfers are irreversible.</p>
              </>
            ) : (
              <p className={styles.cryptoPending} role="status">Crypto support is being set up. A receiving wallet has not been configured.</p>
            )}
          </div>
        )}

        <div className={styles.disclaimer}>
          <Heart size={14} aria-hidden="true" />
          <p>No benefits or special access are required or promised. This is voluntary support, not a charitable donation; no charitable tax receipt is issued.</p>
        </div>
        <div className={styles.footer}>
          <span>© FRUXLABS</span>
          <span><Beer size={14} aria-hidden="true" /> IF YOU FEEL LIKE IT. CHEERS.</span>
        </div>
      </section>
    </div>
  );
}
