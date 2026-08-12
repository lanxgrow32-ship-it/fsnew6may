'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
    Loader2, 
    Plus, 
    Edit, 
    Trash2, 
    Home, 
    Wallet, 
    LogOut, 
    Settings2,
    LayoutGrid,
    Globe,
    Zap,
    UserCheck,
    Swords,
    Users,
    Ticket,
    Newspaper,
    Banknote,
    LineChart,
    ShieldAlert,
    Package,
    RefreshCw
} from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { upsertPlan, deletePlan } from './actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function PlanManagerPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    const fetchPlans = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('plans').select('*').order('sort_order', { ascending: true });
        if (error) {
            console.error("Fetch plans error:", error);
            toast({ title: "Fetch Failed", description: error.message, variant: "destructive" });
        } else {
            setPlans(data || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchPlans(); }, []);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const res = await upsertPlan(formData);
            if (res.error) toast({ title: "Save Failed", description: res.error, variant: "destructive" });
            else {
                toast({ title: "Plan Synchronized", description: "Pricing updated globally." });
                setIsOpen(false);
                fetchPlans();
            }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will remove the plan from the marketplace.")) return;
        const res = await deletePlan(id);
        if (res.error) toast({ title: "Delete Failed", variant: "destructive" });
        else {
            toast({ title: "Plan Removed" });
            fetchPlans();
        }
    };

    const openEdit = (plan: any) => {
        setEditingPlan(plan);
        setIsOpen(true);
    };

    const openAdd = () => {
        setEditingPlan(null);
        setIsOpen(true);
    };

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="border-b p-4 h-[57px] flex items-center">
                    <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg">
                        <FundedStockLogo className="w-8 h-8 text-primary" />
                        <span className="text-foreground">FundedStock 2.0</span>
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/dashboard"><Home />Dashboard</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/plans" isActive><Package />Plan Manager</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/account-requests"><UserCheck />Account Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/instant-pro-requests"><Zap />Instant Pro Ledger</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/activation-hub"><ShieldAlert />Activation Hub</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/competition"><Swords />Competition</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/coupons"><Ticket />Coupons</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/blog"><Newspaper />Blog</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/wallet-requests"><Wallet />Wallet Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payouts"><Banknote />Payouts</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/reports"><LineChart />Reports</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payment-settings"><Settings2 />Settings</SidebarMenuButton></SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="border-t p-2">
                    <SidebarMenu><SidebarMenuItem><form action={signOut} className="w-full"><SidebarMenuButton asChild><button type="submit" className="w-full"><LogOut />Logout</button></SidebarMenuButton></form></SidebarMenuItem></SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4"><SidebarTrigger className="md:hidden" /><h1 className="text-xl font-bold uppercase tracking-tight">Market Orchestrator</h1></div>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={fetchPlans} disabled={loading}><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></Button>
                        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add New Plan</Button>
                        <ThemeToggle />
                    </div>
                </header>
                <main className="p-4 md:p-8 bg-muted/40">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trading Plans Ledger</CardTitle>
                            <CardDescription>Manage the plans that appear on /pricing and in the trader arena.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <div className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></div> : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Market</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Size</TableHead>
                                            <TableHead>Price (INR)</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {plans.length > 0 ? plans.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="capitalize font-bold text-[10px]">
                                                    {p.market_type === 'forex' ? <Badge variant="outline" className="text-blue-500"><Globe className="w-3 h-3 mr-1"/> Forex</Badge> : <Badge variant="outline" className="text-orange-500"><LayoutGrid className="w-3 h-3 mr-1"/> Indian</Badge>}
                                                </TableCell>
                                                <TableCell><Badge className="uppercase text-[9px] font-black">{p.category}</Badge></TableCell>
                                                <TableCell className="font-bold text-sm">{p.title}</TableCell>
                                                <TableCell className="font-mono text-xs">{p.size}</TableCell>
                                                <TableCell className="font-black">₹{p.price.toLocaleString()}</TableCell>
                                                <TableCell>{p.is_active ? <Badge className="bg-green-500">Live</Badge> : <Badge variant="secondary">Disabled</Badge>}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Edit className="w-4 h-4" /></Button>
                                                        <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-20 text-muted-foreground italic">No plans found in the database. Add your first plan to populate the marketplace.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>{editingPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 pt-4">
                        <input type="hidden" name="id" value={editingPlan?.id || ''} />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Market Segment</Label>
                                <Select name="market_type" defaultValue={editingPlan?.market_type || 'indian'}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="indian">Indian Market</SelectItem>
                                        <SelectItem value="forex">Forex Arena</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select name="category" defaultValue={editingPlan?.category || 'pro'}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pro">Instant Pro</SelectItem>
                                        <SelectItem value="instant">Standard Instant</SelectItem>
                                        <SelectItem value="1-step">1-Step Evaluation</SelectItem>
                                        <SelectItem value="2-step">2-Step Evaluation</SelectItem>
                                        <SelectItem value="ptp">PassThenPay</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Full Title (Marketplace Label)</Label>
                            <Input name="title" defaultValue={editingPlan?.title} placeholder="e.g. 10L Standard Evaluation" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Display Size</Label>
                                <Input name="size" defaultValue={editingPlan?.size} placeholder="e.g. 10 Lakh or 10,000" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Sort Order</Label>
                                <Input type="number" name="sort_order" defaultValue={editingPlan?.sort_order || 0} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Price (INR)</Label>
                                <Input type="number" name="price" defaultValue={editingPlan?.price} required />
                            </div>
                            <div className="space-y-2">
                                <Label>USD Equivalent (Optional)</Label>
                                <Input type="number" name="usd_price" defaultValue={editingPlan?.usd_price} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t pt-4">
                            <div className="flex items-center gap-2">
                                <Switch name="is_popular" defaultChecked={editingPlan?.is_popular} />
                                <Label>Feature as Popular</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch name="is_active" defaultChecked={editingPlan?.is_active ?? true} />
                                <Label>Active</Label>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 font-bold" disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin h-5 w-5 mr-2"/> : null}
                            {editingPlan ? 'Update Plan' : 'Add to Marketplace'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}
