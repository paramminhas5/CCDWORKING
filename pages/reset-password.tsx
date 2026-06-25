/**
 * /reset-password — handles Supabase password recovery redirect.
 * 
 * When user clicks "Reset password" link in email, Supabase redirects here
 * with the recovery token in the URL hash. This page detects it,
 * establishes the session, and shows a "set new password" form.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase Auth automatically picks up the token from the URL hash
    // and establishes a session. We just need to wait for it.
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if we already have a session (user clicked link and session was restored)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated!");
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-4">
        <div className="bg-cream border-4 border-ink chunk-shadow p-8 max-w-sm w-full text-center">
          <p className="font-display text-3xl text-magenta mb-3">✓ PASSWORD UPDATED</p>
          <p className="text-ink/70 text-sm mb-6">You can now sign in with your new password.</p>
          <a href="/admin" className="inline-block bg-magenta text-cream font-display text-lg px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
            GO TO ADMIN →
          </a>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-4">
        <div className="bg-cream border-4 border-ink chunk-shadow p-8 max-w-sm w-full text-center">
          <p className="font-display text-xl text-ink mb-3">VERIFYING LINK...</p>
          <p className="text-ink/60 text-sm">If this takes too long, your reset link may have expired. Request a new one from the admin sign-in page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="bg-cream border-4 border-ink chunk-shadow p-8 max-w-sm w-full">
        <h1 className="font-display text-3xl text-ink mb-2">SET NEW PASSWORD</h1>
        <p className="text-ink/60 text-sm mb-6">Choose a new password for your admin account.</p>
        <form onSubmit={handleSubmit}>
          <label className="font-display text-sm text-ink mb-1 block">NEW PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoFocus
            className="w-full border-4 border-ink px-4 py-3 font-medium mb-3 focus:outline-none focus:bg-acid-yellow"
          />
          <label className="font-display text-sm text-ink mb-1 block">CONFIRM PASSWORD</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            className="w-full border-4 border-ink px-4 py-3 font-medium mb-4 focus:outline-none focus:bg-acid-yellow"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-magenta text-cream font-display text-lg py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60"
          >
            {loading ? "UPDATING..." : "UPDATE PASSWORD →"}
          </button>
        </form>
      </div>
    </div>
  );
}
