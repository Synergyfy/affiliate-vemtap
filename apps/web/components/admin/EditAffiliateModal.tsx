import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Banknote, CreditCard, Hash, Fingerprint, Target, UserCog, Users, TrendingUp } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/toast';
import { useUpdateUser, useUpdateUserRole, useAssignUserHierarchy, useUsers } from '@/services/useAdminHooks';
import type { User as UserType, Role } from '@/types/api';

interface EditAffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
  affiliate: UserType | null;
  onUpdate: (updated: UserType) => void;
}

interface FormFieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function FormField({ label, icon, value, onChange, placeholder }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
      />
    </div>
  );
}

export default function EditAffiliateModal({ isOpen, onClose, affiliate, onUpdate }: EditAffiliateModalProps) {
  const { showToast } = useToast();
  const updateUser = useUpdateUser();
  const updateUserRole = useUpdateUserRole();
  const assignHierarchy = useAssignUserHierarchy();

  // Fetch list of supervisors and managers for dropdown assignment
  const { data: supervisorsData } = useUsers({ role: 'SUPERVISOR' as any, limit: 50 });
  const { data: managersData } = useUsers({ role: 'MANAGER' as any, limit: 50 });
  const { data: lineManagersData } = useUsers({ isManager: true, limit: 50 });

  const supervisors = supervisorsData?.data || [];
  const managers = managersData?.data || [];
  const lineManagers = lineManagersData?.data || [];

  // Deduplicate supervisor/manager options
  const supervisorOptions = Array.from(
    new Map(
      [...lineManagers, ...supervisors, ...managers].map(u => [u.id, u])
    ).values()
  ).filter(u => u.id !== affiliate?.id);

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});
  const [selectedRole, setSelectedRole] = useState<Role>('AFFILIATE' as Role);
  const [initialRole, setInitialRole] = useState<Role>('AFFILIATE' as Role);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('');
  const [initialSupervisorId, setInitialSupervisorId] = useState<string>('');

  useEffect(() => {
    if (affiliate) {
      const vals: Record<string, string> = {
        fullName: affiliate.fullName || '',
        phone: affiliate.phone || '',
        avatar: affiliate.avatar || '',
        bankName: affiliate.bankName || '',
        accountNumber: affiliate.accountNumber || '',
        accountName: affiliate.accountName || '',
        nin: affiliate.nin || '',
        bvn: affiliate.bvn || '',
        dailyLeadTarget: String(affiliate.dailyLeadTarget ?? 0),
        monthlyConversionTarget: String(affiliate.monthlyConversionTarget ?? 0),
      };
      setFormValues(vals);
      setInitialValues(vals);
      setSelectedRole(affiliate.role as Role);
      setInitialRole(affiliate.role as Role);
      setSelectedSupervisorId((affiliate as any).supervisorId || (affiliate as any).referrerId || '');
      setInitialSupervisorId((affiliate as any).supervisorId || (affiliate as any).referrerId || '');
    }
  }, [affiliate]);

  const handleChange = useCallback((key: string) => (value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const dirtyFields = Object.keys(formValues).reduce((acc, key) => {
    if (formValues[key] !== initialValues[key]) {
      acc[key] = formValues[key];
    }
    return acc;
  }, {} as Record<string, string>);

  const roleChanged = selectedRole !== initialRole;
  const supervisorChanged = selectedSupervisorId !== initialSupervisorId;
  const hasChanges = Object.keys(dirtyFields).length > 0 || roleChanged || supervisorChanged;

  const handleSubmit = async () => {
    if (!affiliate) return;
    if (!hasChanges) {
      showToast('No changes to save', 'info');
      return;
    }

    try {
      let updatedUser = affiliate;

      if (Object.keys(dirtyFields).length > 0) {
        updatedUser = await updateUser.mutateAsync({ id: affiliate.id, ...dirtyFields });
      }

      if (roleChanged) {
        await updateUserRole.mutateAsync({ userId: affiliate.id, role: selectedRole });
        showToast(`Role updated from ${initialRole} to ${selectedRole}`, 'success');
      }

      if (supervisorChanged) {
        await assignHierarchy.mutateAsync({ userId: affiliate.id, supervisorId: selectedSupervisorId });
        showToast('Assigned supervisor updated successfully', 'success');
      }

      onUpdate({ ...updatedUser, role: selectedRole as any });
      onClose();
    } catch (error: any) {
      showToast(error?.message || 'Failed to update user', 'error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90svh] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">Edit Affiliate Profile</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Personal Information</h5>
                <FormField
                  label="Full Name"
                  icon={<User className="w-3 h-3" />}
                  value={formValues.fullName || ''}
                  onChange={handleChange('fullName')}
                  placeholder="John Doe"
                />
                <FormField
                  label="Phone Number"
                  icon={<Phone className="w-3 h-3" />}
                  value={formValues.phone || ''}
                  onChange={handleChange('phone')}
                  placeholder="08012345678"
                />
                <FormField
                  label="Avatar URL"
                  icon={<User className="w-3 h-3" />}
                  value={formValues.avatar || ''}
                  onChange={handleChange('avatar')}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              {/* Role & Supervisor Hierarchy Assignment */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <UserCog className="w-3.5 h-3.5 text-blue-500" />
                  Role & Supervisor Hierarchy
                </h5>

                {/* Role Switcher */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <UserCog className="w-3 h-3" />
                    User Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as Role)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  >
                    <option value="AFFILIATE">AFFILIATE (Standard Partner)</option>
                    <option value="AGENT">AGENT (Field Agent)</option>
                    <option value="SUPERVISOR">LINE MANAGER (Line Manager / Team Lead)</option>
                    <option value="MANAGER">MANAGER (City / Regional Lead)</option>
                  </select>
                </div>

                {/* Supervisor Re-assignment Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    Assign Line Manager / Manager
                  </label>
                  <select
                    value={selectedSupervisorId}
                    onChange={(e) => setSelectedSupervisorId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  >
                    <option value="">-- Direct / Unassigned --</option>
                    {supervisorOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.email}) — {s.isManagerMode || s.role === 'SUPERVISOR' ? 'Line Manager' : s.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bank Details</h5>
                <FormField
                  label="Bank Name"
                  icon={<Banknote className="w-3 h-3" />}
                  value={formValues.bankName || ''}
                  onChange={handleChange('bankName')}
                  placeholder="GTBank"
                />
                <FormField
                  label="Account Number"
                  icon={<CreditCard className="w-3 h-3" />}
                  value={formValues.accountNumber || ''}
                  onChange={handleChange('accountNumber')}
                  placeholder="0123456789"
                />
                <FormField
                  label="Account Name"
                  icon={<Hash className="w-3 h-3" />}
                  value={formValues.accountName || ''}
                  onChange={handleChange('accountName')}
                  placeholder="John Doe"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verification</h5>
                <FormField
                  label="NIN"
                  icon={<Fingerprint className="w-3 h-3" />}
                  value={formValues.nin || ''}
                  onChange={handleChange('nin')}
                  placeholder="12345678901"
                />
                <FormField
                  label="BVN"
                  icon={<Fingerprint className="w-3 h-3" />}
                  value={formValues.bvn || ''}
                  onChange={handleChange('bvn')}
                  placeholder="12345678901"
                />
              </div>

              {/* Agent Targets Section */}
              {affiliate?.role === 'AGENT' && (
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-violet-500" />
                    Performance Targets
                  </h5>
                  <FormField
                    label="Daily Lead Target"
                    icon={<Target className="w-3 h-3" />}
                    value={formValues.dailyLeadTarget || '0'}
                    onChange={handleChange('dailyLeadTarget')}
                    placeholder="e.g. 10"
                  />
                  <FormField
                    label="Monthly Conversion Target"
                    icon={<TrendingUp className="w-3 h-3" />}
                    value={formValues.monthlyConversionTarget || '0'}
                    onChange={handleChange('monthlyConversionTarget')}
                    placeholder="e.g. 20"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={updateUser.isPending}
                disabled={!hasChanges || updateUser.isPending}
                className="flex-1 h-12 rounded-xl font-bold"
              >
                Save Changes
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
