import { QRCodeSVG } from "qrcode.react";
import { Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  label?: string;
  showActions?: boolean;
  className?: string;
}

export function QRCodeDisplay({
  value,
  size = 180,
  label,
  showActions = true,
  className,
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-${value}`)?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = size + 40;
      canvas.height = size + 40;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
      }

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-${value}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        id={`qr-${value}`}
        className="p-4 bg-white rounded-xl border border-border shadow-card"
      >
        <QRCodeSVG
          value={value}
          size={size}
          level="H"
          includeMargin={false}
          fgColor="hsl(152, 45%, 18%)"
        />
      </div>

      {label && (
        <div className="text-center">
          <p className="font-mono text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">Scan to identify bale</p>
        </div>
      )}

      {showActions && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy Code
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      )}
    </div>
  );
}
