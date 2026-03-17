import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";

export function LoginPage() {
  const navigate = useNavigate();
  const { signInWithPassword, isSupabaseConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setErrorMessage("Supabase is not configured. Update your environment variables.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { error } = await signInWithPassword({ email, password });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <Card title="Login">
        <form className="auth-form" onSubmit={handleSubmit}>
          {!isSupabaseConfigured ? (
            <p className="status-warning">
              Supabase environment variables are missing. Add VITE_SUPABASE_URL and
              VITE_SUPABASE_ANON_KEY.
            </p>
          ) : null}

          {errorMessage ? <p className="status-error">{errorMessage}</p> : null}

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <Button type="submit" disabled={isSubmitting || !isSupabaseConfigured}>
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </Card>
    </div>
  );
}