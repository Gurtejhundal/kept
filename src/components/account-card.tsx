"use client";

import { type FormEvent, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Cloud, KeyRound, LogOut } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

interface AccountCardProps {
  onSync: () => Promise<void>;
  syncStatus: string;
  user: User | null;
}

export function AccountCard({ onSync, syncStatus, user }: AccountCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const configured = isSupabaseConfigured();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setBusy(true);
    setMessage("");
    const result = mode === "signup"
      ? await client.auth.signUp({ email, password })
      : await client.auth.signInWithPassword({ email, password });
    setBusy(false);
    setMessage(result.error ? result.error.message : mode === "signup" && !result.data.session ? "Check your email to confirm the account." : "Signed in.");
  }

  async function oauth(provider: "google" | "apple") {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const result = await client.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    if (result.error) setMessage(result.error.message);
  }

  async function deleteAccount() {
    if (!window.confirm("Delete your Kept account and all synced cloud data? Export a ZIP backup first. Local browser data will remain until you reset it.")) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setBusy(true);
    const result = await client.rpc("delete_account");
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else await client.auth.signOut({ scope: "local" });
  }

  if (!configured) {
    return (
      <article className="settings-card account-card">
        <div className="settings-card-heading"><Cloud size={19} aria-hidden="true" /><div><h2>Cross-device sync</h2><p>The sync client and RLS schema are installed, but no Supabase project is connected.</p></div></div>
        <code className="env-hint">Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
      </article>
    );
  }

  if (user) {
    return (
      <article className="settings-card account-card">
        <div className="settings-card-heading"><Cloud size={19} aria-hidden="true" /><div><h2>Synced account</h2><p>{user.email}</p></div></div>
        <p className="sync-status" role="status">{syncStatus || "Ready to sync this browser."}</p>
        <div className="settings-actions">
          <button className="primary-button" type="button" onClick={() => void onSync()}>Sync now</button>
          <button className="secondary-button" type="button" onClick={() => void getSupabaseBrowserClient()?.auth.signOut({ scope: "global" })}><LogOut size={16} aria-hidden="true" /> Sign out everywhere</button>
          <button className="danger-outline-button" type="button" disabled={busy} onClick={() => void deleteAccount()}>Delete account</button>
        </div>
      </article>
    );
  }

  return (
    <article className="settings-card account-card">
      <div className="settings-card-heading"><KeyRound size={19} aria-hidden="true" /><div><h2>{mode === "signin" ? "Sign in to sync" : "Create your Kept account"}</h2><p>Your local archive remains available before and after sign-in.</p></div></div>
      <form className="account-form" onSubmit={submit}>
        <label htmlFor="account-email">Email</label><input id="account-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <label htmlFor="account-password">Password</label><input id="account-password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}</button>
      </form>
      <div className="settings-actions"><button className="secondary-button" type="button" onClick={() => void oauth("google")}>Continue with Google</button><button className="secondary-button" type="button" onClick={() => void oauth("apple")}>Continue with Apple</button></div>
      <button className="quiet-action" type="button" onClick={() => setMode((value) => value === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Create an account" : "I already have an account"}</button>
      {message && <p className="form-message" role="status">{message}</p>}
    </article>
  );
}
