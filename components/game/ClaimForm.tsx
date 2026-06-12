"use client";

import { useState, type FormEvent } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

interface ClaimFormProps {
  loyaltyPoints: number;
  /** Raw game score (out of MAX_SCORE). Displayed as a read-only field so
   *  the player can confirm what's being submitted for verification. */
  score: number;
  /** Called after successful submit (e.g. to close the dialog). */
  onSubmitted?: () => void;
}

/**
 * Common dial codes — India-first since Spykar is an India-based brand.
 */
const DIAL_CODES: { code: string; label: string }[] = [
  { code: "+91", label: "🇮🇳  +91 India" },
  { code: "+1", label: "🇺🇸  +1 USA / Canada" },
  { code: "+44", label: "🇬🇧  +44 United Kingdom" },
  { code: "+971", label: "🇦🇪  +971 UAE" },
  { code: "+61", label: "🇦🇺  +61 Australia" },
  { code: "+65", label: "🇸🇬  +65 Singapore" },
  { code: "+966", label: "🇸🇦  +966 Saudi Arabia" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  name: string;
  email: string;
  dialCode: string;
  phone: string;
  agreed: boolean;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validate(s: FormState): FieldErrors {
  const e: FieldErrors = {};
  if (!s.name.trim()) e.name = "Required";
  else if (s.name.trim().length < 2) e.name = "Too short";

  if (!s.email.trim()) e.email = "Required";
  else if (!EMAIL_RE.test(s.email)) e.email = "Enter a valid email";

  const digits = s.phone.replace(/\D/g, "");
  if (!digits) e.phone = "Required";
  else if (digits.length < 7 || digits.length > 15) e.phone = "7–15 digits";

  if (!s.agreed) e.agreed = "Please accept the terms";

  return e;
}

export function ClaimForm({ loyaltyPoints, score, onSubmitted }: ClaimFormProps) {
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    dialCode: "+91",
    phone: "",
    agreed: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((cur) => ({ ...cur, [key]: value }));
    if (errors[key]) {
      setErrors((cur) => {
        const next = { ...cur };
        delete next[key];
        return next;
      });
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);

    // POST to /api/loyalty/claim. The server proxies to a Google Apps Script
    // Web App that appends a row to the Spykar loyalty sheet. Errors surface
    // as a toast and keep the form open so the user can retry.
    try {
      const res = await fetch("/api/loyalty/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          dialCode: form.dialCode,
          phone: form.phone.replace(/\D/g, ""),
          score,
          loyaltyPoints,
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        setSubmitting(false);
        toast({
          type: "error",
          title: "Couldn't save your details",
          description: "Please try again in a moment.",
        });
        return;
      }
    } catch {
      setSubmitting(false);
      toast({
        type: "error",
        title: "Network error",
        description: "Check your connection and try again.",
      });
      return;
    }

    setSubmitting(false);
    setSubmitted(true);

    toast({
      type: "success",
      title: "Thank you",
      description: `Hi ${form.name.trim().split(/\s+/)[0]} — once verified, ${loyaltyPoints} Loyalty Points will be added in T+5 days.`,
    });

    if (onSubmitted) window.setTimeout(onSubmitted, 1400);
  };

  if (submitted) {
    return (
      // Bright card on top of the denim result panel — matches the visual
      // pattern of the score / loyalty cards (light surface, dark text) so
      // the success message reads clearly against the dark backdrop.
      <div className="rounded-lg border border-spykar-success/40 bg-gradient-to-b from-white to-spykar-success/15 p-6 text-center text-spykar-ink shadow-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-spykar-success text-white shadow-md">
          <Check className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <p className="mt-4 text-xl font-extrabold text-spykar-ink">
          Thank You
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-spykar-ink/80">
          Once verified, we will be adding{" "}
          <span className="font-semibold text-spykar-ink">
            {loyaltyPoints} Loyalty Points
          </span>{" "}
          to your account in{" "}
          <span className="font-semibold text-spykar-ink">T+5 days</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3 text-left">
      <div className="text-center text-[10px] font-extrabold uppercase tracking-[0.25em] text-white/80">
        Claim your {loyaltyPoints} Spykar LP
      </div>

      {/* Points Scored — read-only, auto-filled from the game state. Submitted
          alongside name/phone/email so the loyalty team can verify the claim. */}
      <div className="space-y-1">
        <Label htmlFor="claim-score" className="text-white">
          Points Scored
        </Label>
        <Input
          id="claim-score"
          name="score"
          value={score}
          readOnly
          aria-readonly
          tabIndex={-1}
          className="cursor-not-allowed bg-spykar-cream font-extrabold tabular-nums text-spykar-ink"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="claim-name" className="text-white">
          Name
        </Label>
        <Input
          id="claim-name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Aarav Sharma"
          autoComplete="name"
          invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-[11px] font-semibold text-spykar-red">{errors.name}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="claim-email" className="text-white">
          Email
        </Label>
        <Input
          id="claim-email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="aarav@example.com"
          autoComplete="email"
          inputMode="email"
          invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-[11px] font-semibold text-spykar-red">{errors.email}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="claim-phone" className="text-white">
          Phone
        </Label>
        <div className="flex gap-2">
          <Select
            value={form.dialCode}
            onValueChange={(v) => update("dialCode", v)}
          >
            <SelectTrigger className="w-[7.5rem] shrink-0" aria-label="Dial code">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIAL_CODES.map((d) => (
                <SelectItem key={d.code} value={d.code}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id="claim-phone"
            type="tel"
            value={form.phone}
            onChange={(e) =>
              update("phone", e.target.value.replace(/[^\d\s-]/g, ""))
            }
            placeholder="9876543210"
            autoComplete="tel-national"
            inputMode="tel"
            invalid={!!errors.phone}
          />
        </div>
        {errors.phone && (
          <p className="text-[11px] font-semibold text-spykar-red">{errors.phone}</p>
        )}
      </div>

      <div className="flex items-start gap-2 pt-1">
        <Checkbox
          id="claim-terms"
          checked={form.agreed}
          onCheckedChange={(v) => update("agreed", v === true)}
          aria-invalid={!!errors.agreed || undefined}
          className="mt-0.5"
        />
        <label
          htmlFor="claim-terms"
          className="cursor-pointer text-xs text-white/80"
        >
          I agree to the{" "}
          <a
            href="https://www.spykar.com/terms-conditions"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-white underline-offset-2 hover:underline"
          >
            terms &amp; conditions
          </a>{" "}
          and to receive Spykar marketing communication.
        </label>
      </div>
      {errors.agreed && (
        <p className="-mt-2 text-[11px] font-semibold text-spykar-red">{errors.agreed}</p>
      )}

      <Button type="submit" disabled={submitting} className="w-full" size="lg">
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Claiming…
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Claim {loyaltyPoints} LP
          </>
        )}
      </Button>
    </form>
  );
}
