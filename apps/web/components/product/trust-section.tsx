import { ShieldCheck, Lock, UserCheck } from "lucide-react";

export function TrustSection() {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">How It Works</h2>

      {/* 3-step strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { step: "1", title: "Choose an offer", desc: "Compare sellers, prices and delivery speed." },
          { step: "2", title: "Pay securely", desc: "Encrypted checkout with trusted providers." },
          { step: "3", title: "Receive your product", desc: "Instant key or manual delivery within SLA." },
        ].map((item) => (
          <div
            key={item.step}
            className="rounded-lg border border-border p-4 space-y-1 text-center"
          >
            <p className="text-2xl font-bold text-primary">{item.step}</p>
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Trust points */}
      <div className="space-y-3">
        {[
          {
            icon: ShieldCheck,
            title: "Money-Back Guarantee",
            desc: "If your order isn't delivered as described, we'll refund your payment.",
          },
          {
            icon: Lock,
            title: "Secure Payments",
            desc: "All transactions are encrypted and processed through trusted payment providers.",
          },
          {
            icon: UserCheck,
            title: "Verified Sellers",
            desc: "Every seller is reviewed before they can list products on our marketplace.",
          },
        ].map((item) => (
          <div key={item.title} className="flex gap-3 items-start">
            <item.icon className="size-5 shrink-0 text-primary mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-foreground">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
