"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { merchantNavItems } from "../../nav";
import { useUser } from "@/hooks/use-user";

interface ParsedRow {
  email: string;
  name?: string;
  denomination: number;
  valid: boolean;
  error?: string;
}

interface BulkResult {
  success: boolean;
  issued: number;
  grcs?: { email: string; claimUrl: string; denomination: number }[];
  errors?: { row: number; email: string; message: string }[];
}

export default function BulkIssuePage() {
  const router = useRouter();
  const { user, userName, isLoading: loading, isAuthenticated } = useUser();
  const [inventory, setInventory] = useState<Map<number, number>>(new Map());
  const [inventoryLoading, setInventoryLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== "merchant" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetch("/api/merchant/grcs/inventory")
        .then((res) => res.json())
        .then((data) => {
          if (data.availableDenominations) {
            const inv = new Map<number, number>();
            data.availableDenominations.forEach((i: { denomination: number; available: number }) => {
              inv.set(i.denomination, i.available);
            });
            setInventory(inv);
          }
          setInventoryLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load inventory:", err);
          setInventoryLoading(false);
        });
    }
  }, [loading, isAuthenticated]);

  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      setParseError("CSV must have a header row and at least one data row");
      return;
    }

    const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
    const emailIndex = header.indexOf("email");
    const nameIndex = header.indexOf("name");
    const denomIndex = header.findIndex((h) => h.includes("denom") || h === "value" || h === "amount");

    if (emailIndex === -1) {
      setParseError("CSV must have an 'email' column");
      return;
    }

    if (denomIndex === -1) {
      setParseError("CSV must have a 'denomination' or 'value' column");
      return;
    }

    const inventoryCopy = new Map(inventory);
    const parsed: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(",").map((c) => c.trim());
      const email = cols[emailIndex] || "";
      const name = nameIndex !== -1 ? cols[nameIndex] : undefined;
      const denomStr = cols[denomIndex] || "";
      const denomination = parseInt(denomStr.replace(/[$,]/g, ""));

      const row: ParsedRow = { email, name, denomination, valid: true };

      // Validate email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        row.valid = false;
        row.error = "Invalid email address";
      }
      // Validate denomination
      else if (isNaN(denomination) || denomination < 50 || denomination > 500) {
        row.valid = false;
        row.error = "Invalid denomination (must be $50-$500)";
      }
      // Check inventory
      else {
        const available = inventoryCopy.get(denomination) || 0;
        if (available < 1) {
          row.valid = false;
          row.error = `No $${denomination} GRCs in inventory`;
        } else {
          inventoryCopy.set(denomination, available - 1);
        }
      }

      parsed.push(row);
    }

    setParsedData(parsed);
    setParseError(null);
  }, [inventory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setParsedData([]);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile);
      setResult(null);
      setParsedData([]);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(droppedFile);
    }
  }, [parseCSV]);

  const handleSubmit = async () => {
    const validRows = parsedData.filter((r) => r.valid);
    if (validRows.length === 0) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/merchant/grcs/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: validRows.map((r) => ({
            email: r.email,
            name: r.name,
            denomination: r.denomination,
          })),
        }),
      });

      const data = await res.json();
      setResult(data);

      // Refresh inventory
      const invRes = await fetch("/api/merchant/grcs/inventory");
      const invData = await invRes.json();
      if (invData.availableDenominations) {
        const inv = new Map<number, number>();
        invData.availableDenominations.forEach((i: { denomination: number; available: number }) => {
          inv.set(i.denomination, i.available);
        });
        setInventory(inv);
      }
    } catch (err) {
      setResult({ success: false, issued: 0, errors: [{ row: 0, email: "", message: "Network error" }] });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "email,name,denomination\njohn@example.com,John Doe,100\njane@example.com,Jane Smith,50";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grc-bulk-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedData.filter((r) => r.valid).length;
  const invalidCount = parsedData.filter((r) => !r.valid).length;

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <>
          <PageHeader
            title="Bulk Issue GRCs"
            description="Upload a CSV file to issue multiple GRCs at once"
            action={
              <a
                href="/merchant/issue"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </a>
            }
          />

          {result?.success ? (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  {result.issued} GRCs Issued Successfully!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Claim links have been generated for all recipients.
                </p>

                {result.errors && result.errors.length > 0 && (
                  <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-left">
                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                      {result.errors.length} row(s) had errors:
                    </p>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      {result.errors.map((err, i) => (
                        <li key={i}>
                          Row {err.row}: {err.email} - {err.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <Button onClick={() => { setResult(null); setFile(null); setParsedData([]); }}>
                    Upload Another File
                  </Button>
                  <a href="/merchant/grcs">
                    <Button variant="outline">View All GRCs</Button>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Upload Zone */}
              <div
                className={`bg-card rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {parsedData.length} rows parsed
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setFile(null); setParsedData([]); setParseError(null); }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Drop CSV file here</p>
                    <p className="text-muted-foreground mb-4">or click to browse</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload">
                      <Button variant="outline" asChild>
                        <span>Select File</span>
                      </Button>
                    </label>
                  </>
                )}
              </div>

              {/* Template Download */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">CSV Format</p>
                  <p className="text-sm text-muted-foreground">
                    email, name (optional), denomination
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              {/* Parse Error */}
              {parseError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">{parseError}</p>
                </div>
              )}

              {/* Preview Table */}
              {parsedData.length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold">Preview</h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          {validCount} valid
                        </span>
                        {invalidCount > 0 && (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <XCircle className="w-4 h-4" />
                            {invalidCount} invalid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Email</th>
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-left p-3 font-medium">Denomination</th>
                          <th className="text-left p-3 font-medium">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {parsedData.map((row, i) => (
                          <tr key={i} className={row.valid ? "" : "bg-red-50/50 dark:bg-red-900/10"}>
                            <td className="p-3">
                              {row.valid ? (
                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                              )}
                            </td>
                            <td className="p-3">{row.email}</td>
                            <td className="p-3 text-muted-foreground">{row.name || "-"}</td>
                            <td className="p-3">${row.denomination}</td>
                            <td className="p-3 text-red-600 dark:text-red-400 text-xs">
                              {row.error || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 border-t border-border flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {validCount} GRCs will be issued
                    </p>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || validCount === 0}
                    >
                      {submitting ? "Issuing..." : `Issue ${validCount} GRCs`}
                    </Button>
                  </div>
                </div>
              )}

              {/* API Error */}
              {result && !result.success && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Failed to issue GRCs. Please try again.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
