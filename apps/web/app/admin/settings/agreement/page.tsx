'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Save, 
  Eye, 
  Edit3,
  ShieldCheck,
  Info,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/toast';
import Link from 'next/link';
import { useAgreement, useUpdateAgreement } from '@/services/useAgreementHooks';
import RichTextEditor from '@/components/admin/RichTextEditor';

export default function AgreementEditor() {
  const { data: agreementData, isLoading, isError } = useAgreement();
  const updateAgreement = useUpdateAgreement();
  const [agreementText, setAgreementText] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (agreementData?.agreementTemplate) {
      setAgreementText(agreementData.agreementTemplate);
    }
  }, [agreementData]);

  const handleSave = async () => {
    try {
      await updateAgreement.mutateAsync({ agreementTemplate: agreementText });
      showToast("Affiliate agreement updated successfully.", "success");
    } catch (error) {
      showToast("Failed to update agreement.", "error");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/admin/settings" className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline mb-2">
              <ChevronLeft className="w-3 h-3" /> Back to Settings
            </Link>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              Agreement Editor
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsPreview(!isPreview)}
              className="h-11 border-slate-200 text-slate-600 font-bold px-6"
            >
              {isPreview ? <Edit3 className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {isPreview ? "Edit Content" : "Live Preview"}
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateAgreement.isPending}
              className="h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold px-8"
            >
              {updateAgreement.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {updateAgreement.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Editor Area */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              layout
              className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col"
            >
              <div className="flex items-center justify-between px-8 py-4 bg-slate-50/50 border-b border-slate-100">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  {isPreview ? "Final Document Preview" : "Agreement Visual Editor"}
                </span>
              </div>

              {isLoading ? (
                <div className="flex-grow flex items-center justify-center min-h-[500px]">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : isPreview ? (
                <div className="flex-grow p-10 prose prose-slate max-w-none prose-h4:text-slate-900 prose-h4:font-black prose-p:text-slate-600 prose-strong:text-slate-900">
                  <div className="mb-8 pb-8 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900 mb-1">Affiliate Agreement</p>
                    <p className="text-xs text-slate-400">Between: Vemtap Team and [Affiliate Name]</p>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: agreementText }} />
                  <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 gap-8 opacity-40 grayscale">
                    <div className="h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Signature Placeholder</span>
                    </div>
                    <div className="h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Date Placeholder</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex-grow flex flex-col">
                  <RichTextEditor 
                    value={agreementText}
                    onChange={setAgreementText}
                  />
                </div>
              )}
            </motion.div>
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-8 rounded-[32px] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck className="w-32 h-32" />
              </div>
              <h3 className="text-lg font-bold mb-4 relative z-10">Legal Compliance</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 relative z-10">
                The affiliate agreement is a legally binding document. Ensure all clauses are vetted by your legal team.
              </p>
              <ul className="space-y-4 relative z-10">
                {[
                  "Independent Contractor clarification",
                  "Non-staff benefits clause",
                  "Tax reporting responsibility",
                  "Confidentiality & Non-disclosure",
                  "Termination protocols"
                ].map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs font-medium text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 p-6 rounded-[24px] border border-blue-100">
              <div className="flex items-center gap-2 text-blue-700 mb-3">
                <Info className="w-5 h-5" />
                <h4 className="font-bold text-sm">Editor Tips</h4>
              </div>
              <p className="text-xs text-blue-600 leading-relaxed">
                Use standard HTML tags like <code className="bg-white px-1 rounded font-bold">&lt;h4&gt;</code> for headings and <code className="bg-white px-1 rounded font-bold">&lt;p&gt;</code> for paragraphs to maintain consistent styling in the mobile app and dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
