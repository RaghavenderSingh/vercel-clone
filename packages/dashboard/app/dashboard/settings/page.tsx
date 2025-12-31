import { UserConfig } from "@/components/settings/UserConfig";
import { TokenManagement } from "@/components/settings/TokenManagement";

export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-10 px-4 md:px-6 space-y-12">
      <div>
        <h1 className="text-4xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground">
            Account Settings
        </h1>
        <p className="text-lg text-muted-foreground font-medium max-w-2xl">
            Manage your personal profile, security preferences, and API access tokens.
        </p>
      </div>

      <UserConfig />
      <TokenManagement />
      
      <div className="h-20" /> {/* Bottom spacer */}
    </div>
  );
}
