import {
  MapPin,
  Calendar,
  Link2,
  Settings,
  Plus,
  ArrowRight,
  Star,
  Plane,
  ArrowUpRight,
  ArrowDown,
  Bell,
  CheckSquare,
  Flame,
} from "lucide-react";

export function RightPanel() {
  return (
    <aside className="flex w-[340px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-border/60 bg-surface p-4">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {[MapPin, Calendar, Link2, Settings].map((Icon, i) => (
            <button
              key={i}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <button className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground shadow-sm hover:opacity-90">
          <Plus className="h-3.5 w-3.5" />
          New Trip
        </button>
      </div>

      {/* Hot Deals */}
      <Section
        icon={<Flame className="h-4 w-4 text-orange-500" />}
        title="Hot Deals For You"
        footer={<FooterLink label="View All Deals" />}
      >
        <div className="space-y-3">
          <DealRow
            image="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=200&q=70"
            title="The Orchid Manali"
            subtitle="Manali, Himachal"
            meta={
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> 4.6 (812)
              </span>
            }
            price="₹3,450"
            priceSub="/ night"
            badge={{ text: "15% OFF", tone: "danger" }}
            link="View on Agoda"
          />
          <DealRow
            image="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=200&q=70"
            title="Delhi (DEL) → Bagdogra (IXB)"
            subtitle="IndiGo · Non-stop"
            meta={<span className="text-xs text-muted-foreground">1h 50m</span>}
            price="₹4,120"
            badge={{ text: "Good Price", tone: "success" }}
            link="View on MakeMyTrip"
          />
        </div>
      </Section>

      {/* Itinerary */}
      <Section
        icon={<Calendar className="h-4 w-4 text-brand" />}
        title="Your Itinerary"
        rightSlot={<span className="text-xs text-muted-foreground">3 Days Trip</span>}
        footer={<FooterLink label="View Full Itinerary" />}
      >
        <ol className="relative space-y-3 border-l border-border/70 pl-4">
          {[
            { day: "Day 1", date: "20 May", title: "Arrive in Darjeeling" },
            { day: "Day 2", date: "21 May", title: "Darjeeling Local Sightseeing" },
            { day: "Day 3", date: "22 May", title: "Trek to Tiger Hill & Departure" },
          ].map((d) => (
            <li key={d.day} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-brand-soft" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {d.day} · {d.date}
                  </p>
                  <p className="text-sm font-medium text-foreground">{d.title}</p>
                </div>
                <button className="text-xs font-medium text-brand hover:underline">
                  View plan
                </button>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Price Watcher */}
      <Section
        icon={<Bell className="h-4 w-4 text-brand" />}
        title="Price Watcher"
        rightSlot={
          <button aria-label="Add" className="text-muted-foreground hover:text-foreground">
            <Plus className="h-4 w-4" />
          </button>
        }
        footer={<FooterLink label="View All Watched" />}
      >
        <div className="space-y-3">
          <WatchRow
            icon={<Plane className="h-4 w-4 text-muted-foreground" />}
            title="Bangalore → Bagdogra"
            sub="20 May · 1 Adult"
            current="Current: ₹4,120"
            change="₹320"
          />
          <WatchRow
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            title="The Orchid Manali"
            sub="20 May – 22 May · 2 Nights"
            current="Current: ₹6,900 / night"
            change="₹800"
          />
        </div>
      </Section>

      {/* Travel Tasks */}
      <Section
        icon={<CheckSquare className="h-4 w-4 text-brand" />}
        title="Travel Tasks"
        rightSlot={
          <button aria-label="Add task" className="text-muted-foreground hover:text-foreground">
            <Plus className="h-4 w-4" />
          </button>
        }
        footer={<FooterLink label="View All Tasks" />}
      >
        <div className="space-y-2">
          <TaskRow title="Book flights to Bagdogra" due="By 18 May" badge="Urgent" tone="danger" />
          <TaskRow title="Pack warm clothes" due="By 19 May" badge="To-do" tone="info" />
        </div>
      </Section>
    </aside>
  );
}

function Section({
  icon,
  title,
  rightSlot,
  footer,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  rightSlot?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {rightSlot ?? (
          <button aria-label="Expand" className="text-muted-foreground hover:text-foreground">
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
      </header>
      {children}
      {footer && <div className="mt-3 border-t border-border/60 pt-3">{footer}</div>}
    </section>
  );
}

function FooterLink({ label }: { label: string }) {
  return (
    <button className="inline-flex w-full items-center justify-between text-xs font-medium text-foreground hover:text-brand">
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </button>
  );
}

const toneClass = {
  success: "bg-success text-success-foreground",
  danger: "bg-danger text-danger-foreground",
  info: "bg-info text-info-foreground",
  warn: "bg-warn text-warn-foreground",
} as const;

function DealRow({
  image,
  title,
  subtitle,
  meta,
  price,
  priceSub,
  badge,
  link,
}: {
  image: string;
  title: string;
  subtitle: string;
  meta: React.ReactNode;
  price: string;
  priceSub?: string;
  badge?: { text: string; tone: keyof typeof toneClass };
  link: string;
}) {
  return (
    <div className="flex gap-3">
      <img src={image} alt={title} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{title}</p>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            <div className="mt-1">{meta}</div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-foreground">
              {price}
              {priceSub && <span className="text-[10px] font-normal text-muted-foreground">{priceSub}</span>}
            </p>
            {badge && (
              <span
                className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${toneClass[badge.tone]}`}
              >
                {badge.text}
              </span>
            )}
          </div>
        </div>
        <button className="mt-1 text-xs font-medium text-brand hover:underline">{link}</button>
      </div>
    </div>
  );
}

function WatchRow({
  icon,
  title,
  sub,
  current,
  change,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  current: string;
  change: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{title}</p>
            <p className="truncate text-xs text-muted-foreground">{sub}</p>
          </div>
          <span className="shrink-0 rounded-md bg-success px-1.5 py-0.5 text-[10px] font-semibold text-success-foreground">
            Watching
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{current}</p>
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-success-foreground">
            <ArrowDown className="h-3 w-3" />
            {change}
          </span>
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  title,
  due,
  badge,
  tone,
}: {
  title: string;
  due: string;
  badge: string;
  tone: keyof typeof toneClass;
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-muted/60">
      <input type="checkbox" className="h-4 w-4 rounded border-border accent-[var(--brand)]" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{due}</p>
      </div>
      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${toneClass[tone]}`}>
        {badge}
      </span>
    </label>
  );
}
