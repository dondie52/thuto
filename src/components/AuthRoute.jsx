import { AuthProvider } from "../lib/auth.jsx";

export default function AuthRoute({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
