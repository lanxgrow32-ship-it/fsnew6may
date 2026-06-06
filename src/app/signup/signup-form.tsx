'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, Sparkles, ShieldCheck, Timer, MessageSquare } from 'lucide-react';
import { FundedStockLogo } from '@/components/ui/logo';
import { ClientOnly } from '@/components/ui/client-only';

export function SignupForm({ paymentSettings }: { paymentSettings: any }) {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden font-poppins">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      <div className="absolute inset-0 z-0">
          <div className="absolute top-[-25%] left-[10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full filter blur-3xl opacity-20 " />
          <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-purple-600 rounded-full filter blur-3xl opacity-10" />
      </div>

      <ClientOnly>
        <div className="w-full max-w-xl space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex justify-center">
            <Button asChild variant="outline" size="sm" className="bg-black/20 border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
              <Link href="https://www.fundedstock.io/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Main Site
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-primary/10 p-4 rounded-3xl border border-primary/20 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                <FundedStockLogo className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tighter text-white">System Optimization</h1>
                <p className="text-gray-500 uppercase text-[10px] font-bold tracking-[0.3em]">Infrastructure Upgrade v2.4.0</p>
              </div>
          </div>

          <Card className="bg-white/5 backdrop-blur-2xl border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="bg-primary h-1.5 w-full relative">
                 <div className="absolute inset-y-0 left-0 bg-white/30 animate-pulse w-[68%]" />
              </div>
              
              <CardContent className="p-8 md:p-12 space-y-8">
                  <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                      <div className="bg-primary text-primary-foreground p-2 rounded-xl animate-spin-slow">
                          <RefreshCw className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                          <p className="text-sm font-bold text-primary uppercase tracking-tight">Technical Work in Progress</p>
                          <p className="text-[10px] text-primary/70 font-medium">Applying security patches and core performance enhancements.</p>
                      </div>
                  </div>

                  <div className="space-y-4 text-center sm:text-left">
                      <h2 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                        <Sparkles className="h-5 w-5 text-purple-400" />
                        Next-Level Experience Coming Soon
                      </h2>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        We are currently upgrading our infrastructure to provide you with a more stable, faster, and feature-rich trading environment. Our team is also resolving minor technical glitches reported during the recent high-load period.
                      </p>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        To ensure 100% data integrity during this core database migration, all new registrations and portal access have been temporarily suspended.
                      </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 border border-white/5 p-4 rounded-2xl space-y-1">
                          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Expected Duration</p>
                          <p className="text-white font-bold flex items-center gap-2">
                              <Timer className="h-3.5 w-3.5 text-primary" />
                              ~ 7 Days
                          </p>
                      </div>
                      <div className="bg-black/40 border border-white/5 p-4 rounded-2xl space-y-1">
                          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Status</p>
                          <p className="text-green-400 font-bold flex items-center gap-2">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Secure
                          </p>
                      </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 text-center">
                       <p className="text-[11px] text-gray-500 font-medium italic">
                        "We apologize for the inconvenience. Our commitment to excellence remains our top priority."
                       </p>
                       <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                           <Button asChild variant="outline" className="w-full sm:w-auto border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl">
                               <Link href="https://wa.me/917020749658" target="_blank">
                                   <MessageSquare className="mr-2 h-4 w-4" />
                                   Priority Support
                               </Link>
                           </Button>
                           <Button disabled className="w-full sm:w-auto bg-slate-800 text-gray-500 border border-white/5 rounded-xl">
                               Maintenance Mode Active
                           </Button>
                       </div>
                  </div>
              </CardContent>
          </Card>
          
          <p className="text-center text-[10px] font-bold text-gray-600 uppercase tracking-[0.4em]">
             System Integrity Verified by FundedStock Security
          </p>
        </div>
      </ClientOnly>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </main>
  );
}
