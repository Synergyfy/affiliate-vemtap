'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
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

const transactions = [
  { id: 1, type: 'Commission', amount: '₦10,000', status: 'Completed', date: '2024-03-20', desc: 'Direct referral - Global Corp' },
  { id: 2, type: 'Withdrawal', amount: '-₦25,000', status: 'Pending', date: '2024-03-18', desc: 'Transfer to GTBank' },
  { id: 3, type: 'Commission', amount: '₦5,000', status: 'Completed', date: '2024-03-15', desc: 'Direct referral - Tech Solutions' },
  { id: 4, type: 'Withdrawal', amount: '-₦15,000', status: 'Completed', date: '2024-03-10', desc: 'Transfer to Zenith Bank' },
];

export default function WalletPage() {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  // In a real app, this would come from a user context or API
  const [kycStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (kycStatus !== 'verified') return;
    
    setIsWithdrawing(true);
    setTimeout(() => {
      setIsWithdrawing(false);
      setShowForm(false);
      // Show success message
    }, 2000);
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
                  <h2 className="text-3xl sm:text-4xl font-black">₦45,200</h2>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-0">
                <div>
                  <p className="text-blue-100 text-[10px] sm:text-xs font-bold mb-1 uppercase tracking-wider">Pending Earnings</p>
                  <p className="text-lg sm:text-xl font-bold">₦12,500</p>
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
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="relative">
                  <Building2 className="absolute left-3 top-[34px] sm:top-[38px] w-4 h-4 sm:w-5 sm:h-5 text-slate-400 z-10" />
                  <Input label="Bank Name" placeholder="Select Bank" className="pl-9 sm:pl-10 text-sm" required />
                </div>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-[34px] sm:top-[38px] w-4 h-4 sm:w-5 sm:h-5 text-slate-400 z-10" />
                  <Input label="Account Number" placeholder="0123456789" className="pl-9 sm:pl-10 text-sm" required />
                </div>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-[34px] sm:top-[38px] w-4 h-4 sm:w-5 sm:h-5 text-slate-400 z-10" />
                  <Input label="Account Name" placeholder="John Doe" className="pl-9 sm:pl-10 text-sm" required />
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

        {/* Transaction History */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Transaction History</h3>
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">View All</Button>
          </div>
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0",
                    tx.type === 'Commission' ? "bg-emerald-50" : "bg-blue-50"
                  )}>
                    {tx.type === 'Commission' ? (
                      <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">{tx.type}</h4>
                    <p className="text-xs text-slate-500 truncate max-w-[150px] sm:max-w-none">{tx.desc}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-sm sm:text-base font-bold",
                    tx.type === 'Commission' ? "text-emerald-600" : "text-slate-900"
                  )}>
                    {tx.amount}
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
