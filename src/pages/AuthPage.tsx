import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, displayName || "Player");
        toast.success("Account created! Check your email to confirm.");
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background safe-top safe-bottom flex flex-col"
    >
      <div className="px-4 pt-6 pb-2 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="font-display font-bold text-lg text-foreground">
          {isSignUp ? "Create Account" : "Sign In"}
        </h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {isSignUp ? "Join the Game" : "Welcome Back"}
            </h1>
            <p className="text-sm text-muted-foreground font-body">
              {isSignUp
                ? "Create an account to save progress & compete"
                : "Sign in to your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className="w-full h-12 rounded-xl border border-border bg-secondary pl-10 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full h-12 rounded-xl border border-border bg-secondary pl-10 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="w-full h-12 rounded-xl border border-border bg-secondary pl-10 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary font-display font-bold text-sm text-primary-foreground glow-green disabled:opacity-50 transition-transform active:scale-[0.98]"
            >
              {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-center text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
