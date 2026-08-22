'use client';

import { FileText, Table, Presentation, CheckCircle2, Download, Eye, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfficeStore } from '@/lib/office-tool/useOfficeStore';
import { OfficeDocType, OfficeDocumentModel } from '@/lib/office-tool/types';
import { useWorkspaceStore } from '@/stores/workspace-store';
import toast from 'react-hot-toast';

interface OfficeArtifactCardProps {
  assetId: string;
  assetName: string;
  docType: OfficeDocType;
  title: string;
  auditScore?: number;
  auditPassed?: boolean;
  metadataSummary?: string;
  model?: any;
  downloadUrl?: string;
}

export function OfficeArtifactCard({
  assetId,
  assetName,
  docType,
  title,
  auditScore = 95,
  auditPassed = true,
  metadataSummary,
  model,
  downloadUrl,
}: OfficeArtifactCardProps) {
  const loadDocument = useOfficeStore((s) => s.loadDocument);
  const setSelectedAsset = useWorkspaceStore((s) => s.setSelectedAsset);

  const handleOpenOnStage = () => {
    setSelectedAsset({
      id: assetId,
      name: assetName,
      type: 'document',
    });

    if (model) {
      loadDocument({ type: docType, model } as OfficeDocumentModel);
      toast.success(`Opened "${title}" in Office Studio`);
    }
  };

  const Icon = docType === 'document' ? FileText : docType === 'spreadsheet' ? Table : Presentation;
  const formatLabel = docType === 'document' ? 'Word (.docx)' : docType === 'spreadsheet' ? 'Excel (.xlsx)' : 'PowerPoint (.pptx)';
  const colorClass = docType === 'document' ? 'text-blue-500 bg-blue-500/10 border-blue-500/30' : docType === 'spreadsheet' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-500 bg-amber-500/10 border-amber-500/30';

  return (
    <div className="my-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm select-none transition-all hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`p-2.5 rounded-lg border shrink-0 ${colorClass}`}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-3xs font-mono font-semibold px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-foreground">
                {formatLabel}
              </span>
              {auditPassed && (
                <span className="inline-flex items-center gap-1 text-3xs font-mono font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                  <CheckCircle2 className="size-3" />
                  <span>Audit: {auditScore}/100</span>
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold text-foreground mt-1 truncate">
              {title}
            </h4>

            {metadataSummary && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {metadataSummary}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <Button
          variant="default"
          size="xs"
          onClick={handleOpenOnStage}
          className="gap-1.5 text-xs font-semibold shadow-2xs"
        >
          <Eye className="size-3.5" />
          <span>Open on Stage</span>
        </Button>

        {downloadUrl && (
          <a
            href={downloadUrl}
            download={assetName}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1 rounded hover:bg-muted/60 transition-colors"
          >
            <Download className="size-3.5" />
            <span>Download</span>
          </a>
        )}
      </div>
    </div>
  );
}

export default OfficeArtifactCard;
