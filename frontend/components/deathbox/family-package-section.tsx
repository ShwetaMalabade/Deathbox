"use client"

import { motion, useInView } from "framer-motion"
import {
  AlertTriangle,
  Clock,
  DollarSign,
  CreditCard,
  XCircle,
  CheckCircle2,
} from "lucide-react"
import { useRef, useMemo } from "react"
import { ScrollReveal } from "./scroll-reveal"
import { useDeathBox } from "@/context/deathbox-context"

type Urgency = "red" | "yellow" | "green" | "gray"

interface PackageItem {
  urgency: Urgency
  title: string
  detail: string
  deadline?: string
}

const urgencyConfig = {
  red: {
    icon: AlertTriangle,
    label: "Urgent Deadline",
    bgClass: "bg-danger/8 border-danger/20",
    textClass: "text-danger",
    badgeClass: "bg-danger/15 text-danger",
    emptyMessage: "No insurance or urgent deadline information was provided.",
  },
  yellow: {
    icon: DollarSign,
    label: "Money Owed",
    bgClass: "bg-warning/8 border-warning/20",
    textClass: "text-warning",
    badgeClass: "bg-warning/15 text-warning",
    emptyMessage: "No bank accounts, investments, or benefits were mentioned.",
  },
  green: {
    icon: CreditCard,
    label: "Debt Clarification",
    bgClass: "bg-success/8 border-success/20",
    textClass: "text-success",
    badgeClass: "bg-success/15 text-success",
    emptyMessage: "No debts, loans, or credit cards were mentioned.",
  },
  gray: {
    icon: XCircle,
    label: "Cancel",
    bgClass: "bg-muted/50 border-border",
    textClass: "text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground",
    emptyMessage: "No subscriptions or memberships were mentioned.",
  },
}

const INSURANCE_DEADLINES: Record<string, string> = {
  cobra: "60 days",
  health: "60 days",
  life: "90 days",
  "ad&d": "30 days",
  "accidental death": "30 days",
  disability: "30 days",
}

function isKnown(val: unknown): val is string | number {
  if (val == null) return false
  if (typeof val === "string" && (val.toLowerCase() === "unknown" || val.trim() === "")) return false
  return true
}

function toMoney(val: unknown): string | null {
  if (!isKnown(val)) return null
  const num = Number(val)
  if (isNaN(num)) return null
  return `$${num.toLocaleString()}`
}

function getUrgency(item: Record<string, unknown>): Urgency {
  const type = ((item.type as string) ?? "").toLowerCase()
  if (type === "insurance") return "red"
  if (type === "bank_account" || type === "investment" || type === "loan_given") return "yellow"
  if (type === "loan_taken" || type === "credit_card") return "green"
  if (type === "subscription" || type === "membership") return "gray"
  return "yellow"
}

function buildTitle(item: Record<string, unknown>): string {
  const type = ((item.type as string) ?? "").toLowerCase()
  const provider = [item.bank_name, item.provider, item.institution, item.issuer, item.lender, item.platform]
    .find(v => isKnown(v)) as string | undefined ?? ""
  const name = [item.name, item.card_name].find(v => isKnown(v)) as string | undefined ?? ""

  switch (type) {
    case "bank_account": {
      const raw = (item.account_type as string) ?? ""
      const acctType = isKnown(raw) ? raw.replace(/\b\w/g, c => c.toUpperCase()) : "Account"
      return provider ? `${provider} ${acctType}` : acctType
    }
    case "investment": {
      const raw = (item.investment_type as string) ?? ""
      const investType = isKnown(raw) ? raw.replace(/\b\w/g, c => c.toUpperCase()) : "Investment"
      return provider ? `${investType} — ${provider}` : investType
    }
    case "insurance": {
      const raw = (item.policy_type as string) ?? ""
      if (!isKnown(raw)) return provider ? `Insurance — ${provider}` : "Insurance"
      const policyType = raw.replace(/\b\w/g, c => c.toUpperCase())
      const label = policyType.toLowerCase().includes("insurance") ? policyType : `${policyType} Insurance`
      return provider ? `${label} — ${provider}` : label
    }
    case "credit_card": {
      if (name) return provider ? `${name} — ${provider}` : name
      return provider ? `Credit Card — ${provider}` : "Credit Card"
    }
    case "loan_taken": {
      const raw = (item.loan_type as string) ?? ""
      const loanType = isKnown(raw) ? raw.replace(/\b\w/g, c => c.toUpperCase()) : "Loan"
      return provider ? `${loanType} — ${provider}` : loanType
    }
    case "loan_given": {
      const borrower = isKnown(item.borrower_name) ? (item.borrower_name as string) : "someone"
      return `Loan to ${borrower}`
    }
    case "subscription":
    case "membership": {
      if (name) return name
      return provider || "Subscription"
    }
    default: {
      if (name) return provider ? `${name} — ${provider}` : name
      const fallbackType = ((item.type as string) ?? "Item").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
      return provider ? `${fallbackType} — ${provider}` : fallbackType
    }
  }
}

function buildDetail(item: Record<string, unknown>): string {
  const type = ((item.type as string) ?? "").toLowerCase()
  const parts: string[] = []

  const balance = [item.balance, item.balance_remaining, item.balance_owed, item.value].find(v => isKnown(v))
  const coverage = item.coverage_amount

  switch (type) {
    case "bank_account": {
      const money = toMoney(balance)
      if (money) parts.push(`Balance: ${money}`)
      if (isKnown(item.account_number)) parts.push(`Account ${item.account_number}`)
      if (item.joint_account === true) parts.push("Joint account — transfers automatically")
      break
    }
    case "investment": {
      const money = toMoney(balance)
      if (money) parts.push(`Balance: ${money}`)
      if (isKnown(item.beneficiary)) parts.push(`Beneficiary: ${item.beneficiary}`)
      break
    }
    case "insurance": {
      const covMoney = toMoney(coverage)
      if (covMoney) parts.push(`Coverage: ${covMoney}`)
      if (isKnown(item.policy_number)) parts.push(`Policy #${item.policy_number}`)
      const premMoney = toMoney(item.premium)
      if (premMoney) parts.push(`Premium: ${premMoney}`)
      break
    }
    case "credit_card": {
      const money = toMoney(balance)
      if (money) parts.push(`Balance owed: ${money}`)
      const limitMoney = toMoney(item.credit_limit)
      if (limitMoney) parts.push(`Limit: ${limitMoney}`)
      break
    }
    case "loan_taken": {
      const money = toMoney(balance)
      if (money) parts.push(`Remaining: ${money}`)
      const monthlyMoney = toMoney(item.monthly_payment)
      if (monthlyMoney) parts.push(`Monthly payment: ${monthlyMoney}`)
      if (isKnown(item.collateral)) parts.push(`Secured by: ${item.collateral}`)
      break
    }
    case "loan_given": {
      const money = toMoney(item.amount)
      if (money) parts.push(`Amount: ${money}`)
      if (isKnown(item.repayment_status)) parts.push(`Status: ${item.repayment_status}`)
      break
    }
    case "subscription":
    case "membership": {
      const cost = toMoney(item.monthly_cost) ?? toMoney(item.cost) ?? toMoney(item.premium)
      if (cost) parts.push(`${cost}/month`)
      break
    }
  }

  const warnings = item.warnings as string[] | undefined
  if (warnings?.length && parts.length < 2) {
    parts.push(warnings[0])
  }

  return parts.length > 0 ? parts.join(". ") + "." : "Details captured from recording."
}

function getDeadline(item: Record<string, unknown>): string | undefined {
  const type = ((item.type as string) ?? "").toLowerCase()
  if (type !== "insurance") return undefined

  const policyType = ((item.policy_type as string) ?? "").toLowerCase()
  for (const [key, deadline] of Object.entries(INSURANCE_DEADLINES)) {
    if (policyType.includes(key)) return deadline
  }
  return undefined
}

function flattenFound(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>
  if (data && typeof data === "object") {
    const flat: Array<Record<string, unknown>> = []
    for (const [catKey, items] of Object.entries(data)) {
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && typeof item === "object") {
            if (!("type" in item)) (item as Record<string, unknown>).type = catKey.replace(/s$/, "")
            flat.push(item as Record<string, unknown>)
          }
        }
      }
    }
    return flat
  }
  return []
}

function buildPackageItems(rawFound: unknown): PackageItem[] {
  const found = flattenFound(rawFound)
  return found.map(item => ({
    urgency: getUrgency(item),
    title: buildTitle(item),
    detail: buildDetail(item),
    deadline: getDeadline(item),
  }))
}

function PackageCard({ item, index }: { item: PackageItem; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-30px" })
  const config = urgencyConfig[item.urgency]
  const Icon = config.icon

  return (
    <motion.div
      ref={ref}
      className={`rounded-xl border p-5 ${config.bgClass}`}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <div className="flex items-start gap-4">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.badgeClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-foreground">{item.title}</h4>
            {item.deadline && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.badgeClass}`}>
                <Clock className="h-3 w-3" />
                {item.deadline}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
        </div>
      </div>
    </motion.div>
  )
}

function EmptySection({ urgency }: { urgency: Urgency }) {
  const config = urgencyConfig[urgency]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/50 p-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
        <Icon className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground/70">{config.emptyMessage}</p>
    </div>
  )
}

const SECTION_DEFS: { urgency: Urgency; title: string }[] = [
  { urgency: "red", title: "Urgent Deadlines" },
  { urgency: "yellow", title: "Money & Benefits" },
  { urgency: "green", title: "Debts & Obligations" },
  { urgency: "gray", title: "Subscriptions to Cancel" },
]

export function FamilyPackageSection() {
  const { analysisResult, recipientName } = useDeathBox()

  const packageItems = useMemo(() => {
    if (!analysisResult?.found) return []
    return buildPackageItems(analysisResult.found)
  }, [analysisResult])

  const sections = useMemo(() => {
    return SECTION_DEFS.map(def => ({
      ...def,
      items: packageItems.filter(i => i.urgency === def.urgency),
    }))
  }, [packageItems])

  const displayName = recipientName || "Your Family"
  const totalItems = packageItems.length

  return (
    <section className="relative px-6 py-32 md:py-40">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <p className="mb-3 text-center text-sm font-medium uppercase tracking-[0.25em] text-amber">
            {`${displayName}'s Package`}
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="mb-4 text-center text-4xl font-bold text-foreground md:text-5xl text-balance">
            Everything organized by priority
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mx-auto mb-6 max-w-xl text-center text-lg text-muted-foreground">
            Color-coded by urgency so your family knows exactly what to do
            first, with clear instructions for every item.
          </p>
        </ScrollReveal>

        {totalItems > 0 && (
          <ScrollReveal delay={0.25}>
            <div className="mb-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>{totalItems} item{totalItems !== 1 ? "s" : ""} organized across {sections.filter(s => s.items.length > 0).length} categories</span>
            </div>
          </ScrollReveal>
        )}

        <div className="flex flex-col gap-10">
          {sections.map((section) => (
            <div key={section.urgency}>
              <ScrollReveal>
                <h3
                  className={`mb-4 text-sm font-semibold uppercase tracking-wider ${urgencyConfig[section.urgency].textClass}`}
                >
                  {section.title}
                </h3>
              </ScrollReveal>
              {section.items.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {section.items.map((item, i) => (
                    <PackageCard key={`${section.urgency}-${item.title}-${i}`} item={item} index={i} />
                  ))}
                </div>
              ) : (
                <EmptySection urgency={section.urgency} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
