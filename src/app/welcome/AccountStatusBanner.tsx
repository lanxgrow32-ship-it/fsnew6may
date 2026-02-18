'use client';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FundedStockLogo } from '@/components/ui/logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { signOut } from '@/app/actions';
import {
  Bell,
  BookUser,
  BrainCircuit,
  Check,
  CheckCircle,
  DollarSign,
  ExternalLink,
  FileCheck,
  Gift,
  Home,
  Loader2,
  LogOut,
  MessageSquare,
  ShieldAlert,
  Swords,
  User,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { CredentialsView } from './credentials-view';
import { OnboardingGuide } from './onboarding-guide';
import { ReceiptButton } from './receipt-button';

export function AccountStatusBanner({ profile }: { profile: any }) {
  if (
    profile.credentials_provided ||
    (profile.account_type === 'competition' && profile.has_credentials)
  ) {
    return (
      <div className="p-6 rounded-lg bg-primary text-primary-foreground mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                Welcome back, {profile.full_name || 'User'}!
              </h2>
              <p className="opacity-90">
                {profile.account_type === 'competition'
                  ? 'Your competition account is ready.'
                  : 'Your account is fully active. Here are your trading credentials.'}
              </p>
            </div>
          </div>
          {profile.account_type === 'standard' && (
            <ReceiptButton profile={profile} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg bg-card border mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Welcome, {profile.full_name || 'User'}!
          </h2>
          <p className="text-muted-foreground">
            Your account has been created. Please complete the final steps to
            start trading.
          </p>
        </div>
        {profile.account_type === 'standard' && (
          <ReceiptButton profile={profile} />
        )}
      </div>
    </div>
  );
}
