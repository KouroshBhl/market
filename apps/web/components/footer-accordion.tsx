"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@workspace/ui";
import { localePath, type Locale } from "@/lib/i18n";

interface FooterLink {
  readonly label: string;
  readonly href: string;
  readonly external?: boolean;
}

interface FooterColumn {
  readonly title: string;
  readonly links: readonly FooterLink[];
}

export function FooterAccordion({
  columns,
  locale,
}: {
  columns: readonly FooterColumn[];
  locale: Locale;
}) {
  return (
    <div className="space-y-1">
      {columns.map((column) => (
        <Collapsible key={column.title}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors">
            {column.title}
            <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="space-y-1 px-3 pb-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      rel="noopener"
                      className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={localePath(locale, link.href)}
                      className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
