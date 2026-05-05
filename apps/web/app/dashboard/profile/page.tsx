'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  ShieldCheck, 
  CreditCard, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Upload,
  Camera,
  Info,
  Save,
  Lock,
  Clock
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nin: '',
    bvn: '',
    idType: 'NIN',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get('/users/profile');
        setProfileData({
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          nin: data.nin || '',
          bvn: data.bvn || '',
          idType: data.nin ? 'NIN' : (data.bvn ? 'BVN' : 'NIN'),
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          accountName: data.accountName || '',
        });
        
        // Map KycStatus enum to UI status
        const status = data.kycStatus === 'VERIFIED' ? 'verified' : 
                      data.kycStatus === 'PENDING' ? (data.nin || data.bvn ? 'pending' : 'unverified') : 
                      'unverified';
        setKycStatus(status as any);
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (selectedFile) {
        setUploadProgress(50);
        // Simulate upload
        await new Promise(resolve => setTimeout(resolve, 500));
        setUploadProgress(100);
      }

      const updatedUser = await api.patch('/users/profile', {
        fullName: profileData.fullName,
        phone: profileData.phone,
        nin: profileData.idType === 'NIN' ? profileData.nin : undefined,
        bvn: profileData.idType === 'BVN' ? profileData.nin : undefined,
        bankName: profileData.bankName,
        accountNumber: profileData.accountNumber,
        accountName: profileData.accountName
      });
      
      // Update local auth context
      updateUser(updatedUser);
      
      showToast('Profile updated successfully', 'success');
      
      if (profileData.nin || profileData.bvn) {
        setKycStatus('pending');
      }
    } catch (error: any) {
      showToast(error.message || 'Error updating profile', 'error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be under 5MB', 'error');
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Profile & Verification</h2>
          <p className="text-slate-500">Manage your personal details and KYC verification for withdrawals.</p>
        </div>

        {/* KYC Status Banner */}
        <div className={cn(
          "p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6",
          kycStatus === 'unverified' ? "bg-amber-50 border-amber-100" :
          kycStatus === 'pending' ? "bg-blue-50 border-blue-100" :
          "bg-emerald-50 border-emerald-100"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              kycStatus === 'unverified' ? "bg-amber-100 text-amber-600" :
              kycStatus === 'pending' ? "bg-blue-100 text-blue-600" :
              "bg-emerald-100 text-emerald-600"
            )}>
              {kycStatus === 'unverified' ? <AlertCircle className="w-6 h-6" /> :
               kycStatus === 'pending' ? <Clock className="w-6 h-6" /> :
               <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <h3 className={cn(
                "font-bold text-lg",
                kycStatus === 'unverified' ? "text-amber-900" :
                kycStatus === 'pending' ? "text-blue-900" :
                "text-emerald-900"
              )}>
                KYC Status: {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
              </h3>
              <p className={cn(
                "text-sm",
                kycStatus === 'unverified' ? "text-amber-700" :
                kycStatus === 'pending' ? "text-blue-700" :
                "text-emerald-700"
              )}>
                {kycStatus === 'unverified' ? "Complete your verification to enable withdrawals." :
                 kycStatus === 'pending' ? "Your documents are being reviewed. This usually takes 24-48 hours." :
                 "Your account is fully verified. Withdrawals are enabled."}
              </p>
            </div>
          </div>
          {kycStatus === 'unverified' && (
            <Button className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-lg shadow-amber-200">
              Verify Now
            </Button>
          )}
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Basic Info */}
          <div className="md:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
              </div>
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                  <p className="text-slate-500 font-bold">Fetching your profile details...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Full Name</label>
                    <input 
                      type="text" 
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email Address</label>
                    <input 
                      type="email" 
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Phone Number</label>
                    <input 
                      type="tel" 
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                      placeholder="+234 ..."
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">National Identity (KYC)</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">ID Type</label>
                  <select 
                    value={profileData.idType}
                    onChange={(e) => setProfileData({...profileData, idType: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all bg-white"
                  >
                    <option value="NIN">NIN (National Identity Number)</option>
                    <option value="BVN">BVN (Bank Verification Number)</option>
                    <option value="DL">Driver&apos;s License</option>
                    <option value="IP">International Passport</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">ID Number ({profileData.idType})</label>
                  <input 
                    type="text" 
                    value={profileData.nin}
                    onChange={(e) => setProfileData({...profileData, nin: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                    placeholder={`Enter your ${profileData.idType} number`}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Upload ID Document</label>
                  <label className={cn(
                    "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group block",
                    selectedFile ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                  )}>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                    />
                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-blue-600" />
                        <p className="text-sm font-bold text-blue-900">{selectedFile.name}</p>
                        <p className="text-xs text-blue-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        
                        {uploadProgress > 0 && (
                          <div className="w-full max-w-xs mt-4">
                            <div className="flex justify-between text-xs mb-1 font-bold text-blue-900">
                              <span>Uploading...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-blue-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-blue-600 transition-colors" />
                        <p className="text-sm font-bold text-slate-600">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-400 mt-1">PNG, JPG or PDF (max. 5MB)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Bank Account Details</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Bank Name</label>
                  <input 
                    type="text" 
                    value={profileData.bankName}
                    onChange={(e) => setProfileData({...profileData, bankName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                    placeholder="e.g. GTBank, Zenith"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Account Number</label>
                  <input 
                    type="text" 
                    value={profileData.accountNumber}
                    onChange={(e) => setProfileData({...profileData, accountNumber: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                    placeholder="10-digit account number"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Account Name</label>
                  <input 
                    type="text" 
                    value={profileData.accountName}
                    onChange={(e) => setProfileData({...profileData, accountName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                    placeholder="Must match your profile name"
                  />
                  <p className="text-[10px] text-amber-600 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Withdrawals will fail if account name doesn&apos;t match your ID.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Profile Card & Actions */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-400" />
              <div className="px-6 pb-8 text-center">
                <div className="relative -mt-12 mb-4 inline-block">
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                    <User className="w-12 h-12" />
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full border-2 border-white hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="text-xl font-bold text-slate-900">{profileData.fullName || 'New Affiliate'}</h4>
                <p className="text-sm text-slate-500">{profileData.email}</p>
                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined</p>
                    <p className="text-sm font-bold text-slate-700">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '...'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level</p>
                    <p className="text-sm font-bold text-blue-600">
                      {user?.role === 'manager' ? 'Manager' : 'Affiliate'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-blue-400" />
                <h4 className="font-bold">Security Tip</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ensure your BVN/NIN details are correct. Vemtap uses these to verify your identity and protect your earnings from unauthorized withdrawals.
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={isSaving}
              className="w-full h-14 rounded-2xl text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  Save Changes
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
