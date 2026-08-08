import { cn } from '@/lib/utils';
import { SalesPipelineStage, PIPELINE_ORDER, PIPELINE_STAGES } from '@/types/sales-pipeline';
import { CheckCircle, Circle } from 'lucide-react';

interface SalesPipelineProgressProps {
  currentStage: SalesPipelineStage;
  exitState?: string;
  className?: string;
  compact?: boolean;
}

export default function SalesPipelineProgress({
  currentStage,
  exitState,
  className,
  compact = false,
}: SalesPipelineProgressProps) {
  const currentIndex = PIPELINE_ORDER.indexOf(currentStage);
  const isExited = !!exitState;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {PIPELINE_ORDER.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const stageInfo = PIPELINE_STAGES[stage];

          return (
            <div key={stage} className="flex items-center">
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center",
                  isCompleted && !isExited ? 'bg-emerald-600' :
                  isCurrent && !isExited ? 'bg-blue-600' :
                  'bg-slate-300',
                )}
              >
                {isCompleted && !isExited && <CheckCircle className="w-2.5 h-2.5 text-white" />}
              </div>
              {idx < PIPELINE_ORDER.length - 1 && (
                <div className={cn("w-4 h-0.5", isCompleted ? 'bg-emerald-400' : 'bg-slate-200')} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Sales Pipeline
        </h4>
        {exitState && (
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Status: {exitState.replace('_', ' ')}
          </span>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200 -z-0" />
        <div
          className="absolute left-3 top-0 -z-0 transition-all duration-500"
          style={{
            height: `${isExited ? 0 : (currentIndex / (PIPELINE_ORDER.length - 1)) * 100}%`,
            backgroundColor: isExited ? '#94a3a8' : '#3b82f6',
          }}
        />

        <div className="space-y-2 relative z-10">
          {PIPELINE_ORDER.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const stageInfo = PIPELINE_STAGES[stage];

            return (
              <div key={stage} className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all",
                    isCompleted && !isExited
                      ? 'bg-emerald-600 text-white'
                      : isCurrent && !isExited
                        ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                        : isExited
                          ? 'bg-slate-300 text-slate-500'
                          : 'bg-slate-200 text-slate-400',
                  )}
                >
                  {isCompleted && !isExited ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : isCurrent && !isExited ? (
                    <Circle className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Circle className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-xs font-black",
                      isCompleted || (isCurrent && !isExited)
                        ? 'text-slate-900'
                        : isExited
                          ? 'text-slate-500'
                          : 'text-slate-400',
                    )}
                  >
                    {stageInfo.label}
                  </p>
                  {isCurrent && !isExited && (
                    <p className="text-[9px] text-blue-600 font-semibold">Current stage</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
