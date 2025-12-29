"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, Mail, ExternalLink, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SentEmail = {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  boardId: string;
  boardTitle: string;
  sentToResend: boolean;
  createdAt: string;
};

export default function DevEmailsPage() {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [notAllowed, setNotAllowed] = useState(false);
  const router = useRouter();

  const fetchEmails = useCallback(async () => {
    try {
      const response = await fetch("/api/dev/emails");
      if (response.status === 404) {
        // API returned 404 - not allowed in this environment
        setNotAllowed(true);
        setLoading(false);
        return;
      }
      const data = await response.json();
      setEmails(data.emails || []);
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleProcessNotifications = async () => {
    setProcessing(true);
    try {
      const response = await fetch("/api/dev/emails", { method: "POST" });
      const data = await response.json();
      console.log("Processed notifications:", data);
      await fetchEmails();
    } catch (error) {
      console.error("Failed to process notifications:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all sent emails?")) {
      return;
    }
    setClearing(true);
    try {
      await fetch("/api/dev/emails", { method: "DELETE" });
      setEmails([]);
    } catch (error) {
      console.error("Failed to clear emails:", error);
    } finally {
      setClearing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh p-8">
        <div className="mx-auto max-w-4xl">
          <div className="glass glass-strong border border-border/50 p-8 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notAllowed) {
    return (
      <div className="min-h-screen gradient-mesh p-8">
        <div className="mx-auto max-w-4xl">
          <div className="glass glass-strong border border-border/50 p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Not Available</h1>
            <p className="text-muted-foreground">
              The email viewer is only available in development and test environments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh p-8">
      <div className="mx-auto max-w-4xl">
        <div className="glass glass-strong border border-border/50 p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Mail className="h-8 w-8" />
                Email Viewer
              </h1>
              <p className="mt-2 text-muted-foreground">
                Development tool for viewing sent emails (Letter Opener style)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleProcessNotifications}
                disabled={processing}
                variant="default"
              >
                <RefreshCw className={processing ? "animate-spin" : ""} />
                {processing ? "Processing..." : "Process Notifications"}
              </Button>
              <Button
                onClick={handleClearAll}
                disabled={clearing || emails.length === 0}
                variant="destructive"
              >
                <Trash2 />
                Clear All
              </Button>
            </div>
          </div>

          {/* Email list */}
          {emails.length === 0 ? (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-12 text-center">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg text-muted-foreground">No emails sent yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Perform actions that trigger notifications, then click &quot;Process Notifications&quot;
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {emails.map((email) => (
                <Link
                  key={email.id}
                  href={`/dev/emails/${email.id}`}
                  className="block rounded-lg border border-border/50 bg-white/40 dark:bg-white/5 p-4 transition-colors hover:bg-white/60 dark:hover:bg-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          {email.recipientName}
                        </span>
                        <span className="text-muted-foreground text-sm truncate">
                          &lt;{email.recipientEmail}&gt;
                        </span>
                      </div>
                      <p className="mt-1 font-medium text-foreground">{email.subject}</p>
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Board: {email.boardTitle}</span>
                        <span>{formatDate(email.createdAt)}</span>
                        {email.sentToResend ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            Sent via Resend
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <Clock className="h-3 w-3" />
                            Local only
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
