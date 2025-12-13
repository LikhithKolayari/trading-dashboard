import { useState } from "react";
import Button from "../components/Button";
import { useAuth } from "../context/useAuth";
import SymbolSelect from "../components/SymbolSelect";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [symbol, setSymbol] = useState<string>("");

  const onLogout = async () => {
    await logout();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl p-6 shadow">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <Button variant="secondary" onClick={onLogout}>
            Logout
          </Button>
        </div>

        <div className="space-y-2 text-gray-200">
          <p>
            Welcome,{" "}
            <span className="font-semibold">
              {user.firstName} {user.lastName}
            </span>
          </p>
          <p>Email: {user.email}</p>
          <p>Date of Birth: {user.dateOfBirth}</p>
        </div>
        <div className="mt-6">
          <SymbolSelect value={symbol} onChange={setSymbol} />
          {symbol && (
            <p className="mt-2 text-sm text-gray-300">
              Selected: <span className="font-mono">{symbol}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
