'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Building2,
  CreditCard,
  User as UserIcon,
  AlertCircle,
  ShieldCheck,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';

const earningsData = [
  { id: 1, name: 'Tech Solutions Ltd', plan: 'Silver', status: 'Active', month: '2/3', affiliateEarning: '₦1,000', managerEarning: '₦100', date: '2024-03-20' },
  { id: 2, name: 'Global Corp', plan: 'Platinum', status: 'Active', month: '5/12', affiliateEarning: '₦3,600', managerEarning: '₦360', date: '2024-03-18' },
  { id: 3, name: 'Small Biz Inc', plan: 'Gold', status: 'Inactive', month: '1/3', affiliateEarning: '₦0', managerEarning: '₦0', date: '2024-03-15' },
  { id: 4, name: 'Future Tech', plan: 'Gold', status: 'Active', month: '3/3', affiliateEarning: '₦1,900', managerEarning: '₦190', date: '2024-03-10' },
];

const transactions = [
  { id: 1, type: 'Commission', amount: '₦10,000', status: 'Completed', date: '2024-03-20', desc: 'Direct referral - Global Corp' },
  { id: 2, type: 'Withdrawal', amount: '-₦25,000', status: 'Pending', date: '2024-03-18', desc: 'Transfer to GTBank' },
  { id: 3, type: 'Commission', amount: '₦5,000', status: 'Completed', date: '2024-03-15', desc: 'Direct referral - Tech Solutions' },
];

export default function WalletPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({ balance: 0, totalEarned: 0, pending: 0 });
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  
  const kycStatus = user?.kycStatus === 'VERIFIED' ? 'verified' : 
                   user?.kycStatus === 'PENDING' ? 'pending' : 'unverified';

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const [profileData, commissionResponse, withdrawalResponse] = await Promise.all([
          api.get('/users/profile'),
          api.get('/commissions/me?limit=10'),
          api.get('/withdrawals/me?limit=10')
        ]);
        
        if (profileData) {
          setProfile(profileData);
          setStats({
            balance: Number(profileData.pendingEarnings || 0),
            totalEarned: Number(profileData.totalEarnings || 0),
            pending: 0 // Backend currently puts all unpaid in pendingEarnings
          });
        }
        
        // Combine commissions and withdrawals for transaction history
        const combinedTransactions = [
          ...(commissionResponse?.data || []).map((c: any) => ({
            id: c.id,
            type: 'commission',
            title: 'Commission Earned',
            desc: c.description || `Earnings from ${c.business?.businessName || 'referral'}`,
            amount: Number(c.amount),
            status: c.status === 'PAID' ? 'Completed' : 'Pending',
            time: c.createdAt
          })),
          ...(withdrawalResponse?.data || []).map((w: any) => ({
            id: w.id,
            type: 'withdrawal',
            title: 'Withdrawal',
            desc: `Transfer to ${w.bankName}`,
            amount: Number(w.amount),
            status: w.status === 'PAID' ? 'Completed' : 'Pending',
            time: w.createdAt
          }))
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        
        setTransactions(combinedTransactions);
      } catch (error) {
        console.error('Failed to fetch wallet data:', error);
      }
    };
    fetchWalletData();
  }, [user]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kycStatus !== 'verified') return;
    if (Number(amount) < 5000) {
      showToast('Minimum withdrawal is ₦5,000', 'error');
      return;
    }
    
    setIsWithdrawing(true);
    try {
      await api.post('/withdrawals', { amount: Number(amount) });
      showToast('Withdrawal successful! Processing will take 24-48 hours.', 'success');
      setShowForm(false);
      setAmount('');
      
      // Refresh balance
      const updatedProfile = await api.get('/users/profile');
      setStats({
        balance: Number(updatedProfile.pendingEarnings || 0),
        totalEarned: Number(updatedProfile.totalEarnings || 0),
        pending: 0
      });
    } catch (error: any) {
      console.error('Withdrawal failed:', error);
      showToast(error?.message || 'Failed to process withdrawal.', 'error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-600 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-200"
          >
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full -mr-24 -mt-24 sm:-mr-32 sm:-mt-32 blur-3xl" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8 sm:mb-12">
                <div className="bg-white/20 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl">
                  <Wallet className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-xs sm:text-sm font-medium mb-1">Available Balance</p>
                  <h2 className="text-3xl sm:text-4xl font-black">₦{stats.balance.toLocaleString()}</h2>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-0">
                <div>
                  <p className="text-blue-100 text-[10px] sm:text-xs font-bold mb-1 uppercase tracking-wider">Pending Earnings</p>
                  <p className="text-lg sm:text-xl font-bold">₦{stats.pending.toLocaleString()}</p>
                </div>
                <Button 
                  className={cn(
                    "bg-white text-blue-600 hover:bg-blue-50 shadow-none px-6 sm:px-8 w-full sm:w-auto text-sm sm:text-base font-bold",
                    kycStatus !== 'verified' && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => kycStatus === 'verified' && setShowForm(true)}
                >
                  Withdraw Now
                </Button>
              </div>
              {kycStatus !== 'verified' && (
                <div className="mt-6 p-3 bg-white/10 rounded-xl border border-white/20 flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
                  <p className="text-[10px] sm:text-xs text-blue-50 font-medium">
                    KYC Verification required for withdrawals. <Link href="/dashboard/profile" className="underline font-bold hover:text-white">Verify now</Link>
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Withdrawal Form */}
          {showForm ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Withdraw Funds</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleWithdraw} className="space-y-6">
                <div className="relative">
                  <span className="absolute left-4 top-[38px] font-bold text-slate-400 z-10">₦</span>
                  <Input 
                    label="Amount to Withdraw" 
                    type="number"
                    placeholder="Enter amount (min. ₦5,000)" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-9 sm:pl-10 text-sm" 
                    required 
                  />
                </div>
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-bold">Payout Destination</h4>
                  </div>
                  
                  {profile?.bankName ? (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">{profile.accountName}</p>
                      <p className="text-xs text-slate-500">{profile.bankName} • {profile.accountNumber}</p>
                    </div>
                  ) : (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                      <p className="text-xs text-red-600 leading-relaxed mb-2">
                        No bank account details found in your profile.
                      </p>
                      <Link href="/dashboard/profile">
                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold border-red-200 text-red-700 hover:bg-red-100">
                          Add Bank Details
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  {kycStatus !== 'verified' ? (
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-4 space-y-3">
                      <div className="flex items-center gap-2 text-amber-800">
                        <Lock className="w-4 h-4" />
                        <p className="text-xs font-bold uppercase tracking-wider">Withdrawal Locked</p>
                      </div>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Your account is currently {kycStatus}. You must complete your KYC verification before you can withdraw funds.
                      </p>
                      <Link href="/dashboard/profile">
                        <Button variant="outline" className="w-full border-amber-200 text-amber-800 hover:bg-amber-100 mt-2 text-xs font-bold">
                          Complete Verification
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] sm:text-xs text-slate-500 mb-4">Minimum withdrawal amount is ₦5,000. Processing takes 24-48 hours.</p>
                      <Button type="submit" className="w-full text-sm sm:text-base font-bold" isLoading={isWithdrawing}>
                        Confirm Withdrawal
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </motion.div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                {kycStatus === 'verified' ? (
                  <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
                ) : (
                  <History className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                {kycStatus === 'verified' ? 'Ready to withdraw?' : 'KYC Required'}
              </h3>
              <p className="text-sm sm:text-base text-slate-500 mb-6">
                {kycStatus === 'verified' 
                  ? 'Transfer your earnings directly to your local bank account safely and securely.'
                  : 'Complete your identity verification to unlock withdrawals and secure your account.'}
              </p>
              {kycStatus === 'verified' ? (
                <Button variant="outline" className="w-full sm:w-auto font-bold" onClick={() => setShowForm(true)}>
                  Setup Withdrawal
                </Button>
              ) : (
                <Link href="/dashboard/profile" className="w-full sm:w-auto">
                  <Button className="w-full font-bold bg-blue-600 hover:bg-blue-700">
                    Verify Identity
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Section B: Earnings Breakdown Table */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Earnings Breakdown</h3>
              <p className="text-xs text-slate-500 mt-1">Detailed monthly share from your referrals</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Affiliate (20%)
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-600">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Manager (10%)
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Business</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Plan</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Month</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Affiliate (20%)</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Manager (10%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.filter(t => t.type === 'commission').slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{item.desc.replace('Earnings from ', '')}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                        {new Date(item.time).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600 px-2 py-1 bg-slate-100 rounded-md">Direct</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border",
                        item.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"
                      )}>
                        {item.status === 'Completed' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-900">Current</span>
                        <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 w-full" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-emerald-600">₦{item.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-blue-600">₦0</span>
                    </td>
                  </tr>
                ))}
                {transactions.filter(t => t.type === 'commission').length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">
                      No commission data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Transaction History</h3>
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">View All</Button>
          </div>
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <div key={tx.id || tx.time} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0",
                    tx.type === 'commission' ? "bg-emerald-50" : "bg-blue-50"
                  )}>
                    {tx.type === 'commission' ? (
                      <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">{tx.title}</h4>
                    <p className="text-xs text-slate-500 truncate max-w-[150px] sm:max-w-none">{tx.desc}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-sm sm:text-base font-bold",
                    tx.type === 'commission' ? "text-emerald-600" : "text-slate-900"
                  )}>
                    {tx.type === 'commission' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {tx.status === 'Completed' ? (
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500" />
                    ) : (
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-500" />
                    )}
                    <span className={cn(
                      "text-[8px] sm:text-[10px] font-bold uppercase tracking-wider",
                      tx.status === 'Completed' ? "text-emerald-500" : "text-orange-500"
                    )}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
