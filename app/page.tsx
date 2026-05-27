import Link from "next/link";
import { ArrowRight, Gamepad2, Gift, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
	return (
		<main className="relative min-h-screen overflow-hidden">
			{/* Decorative denim bands */}
			<div className="absolute inset-x-0 top-0 h-1 bg-spykar-red" />
			<div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-spykar-red/10 blur-3xl" />
			<div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-spykar-indigo/10 blur-3xl" />

			{/* Header */}
			<header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
				<div className="flex items-center gap-2">
					<div className="rounded-md bg-spykar-ink px-2 py-1 text-[11px] font-extrabold tracking-[0.25em] text-white">
						SPYKAR
					</div>
					<span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
						×&nbsp;Feed&nbsp;your&nbsp;Greed
					</span>
				</div>
				<nav className="flex items-center gap-2">
					{/* <Button asChild variant="ghost" size="sm">
            <Link href="/admin/products">
              <Settings className="mr-1.5 h-4 w-4" />
              Admin
            </Link>
          </Button> */}
					<Button asChild size="sm">
						<Link href="/play">
							Play
							<ArrowRight className="ml-1.5 h-4 w-4" />
						</Link>
					</Button>
				</nav>
			</header>

			{/* Hero */}
			<section className="relative z-10 mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-8 sm:grid-cols-2 sm:items-center sm:pt-14">
				<div>
					<div className="mb-4 inline-flex items-center gap-2 rounded-full bg-spykar-ink px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.25em] text-white">
						<span className="h-1.5 w-1.5 rounded-full bg-spykar-red" />
						Young &amp; Restless
					</div>
					<h1 className="text-5xl font-black leading-[0.95] tracking-tight text-spykar-ink sm:text-7xl">
						Feed Your
						<span className="block text-spykar-red">Greed.</span>
					</h1>
					<p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
						Thirty seconds. Falling denim, accessories, bombs — grab the jeans,
						dodge the rest. Score 400+ for top-tier Spykar Loyalty Points. Made
						to chill, built to last.
					</p>
					<div className="mt-7 flex flex-wrap gap-3">
						<Button asChild size="xl" className="rounded-full px-10 shadow-lg">
							<Link href="/play">
								<Gamepad2 className="mr-2 h-5 w-5" />
								START
							</Link>
						</Button>
						{/* <Button asChild size="xl" variant="outline" className="rounded-full px-8">
              <Link href="/admin/products">
                <Settings className="mr-2 h-5 w-5" />
                Configure
              </Link>
            </Button> */}
					</div>
				</div>

				{/* Visual: brand swatch + reward tiers */}
				<div className="relative">
					{/* <div className="grid grid-cols-3 gap-2">
						<div className="h-28 rounded-md bg-spykar-red" />
						<div className="h-28 rounded-md bg-spykar-ink" />
						<div className="h-28 rounded-md bg-spykar-indigo" />
						<div className="h-16 rounded-md bg-spykar-cream ring-1 ring-border" />
						<div className="h-16 rounded-md bg-white ring-1 ring-border" />
						<div className="h-16 rounded-md bg-spykar-stone/30" />
					</div> */}

					<div className="mt-6 rounded-lg border border-border bg-card p-5 shadow-sm">
						<div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-muted-foreground">
							<Gift className="h-3.5 w-3.5 text-spykar-red" /> Loyalty reward
							tiers
						</div>
						<ul className="space-y-2 text-sm">
							<li className="flex items-baseline justify-between">
								<span className="text-muted-foreground">0 – 99</span>
								<span className="font-semibold">100 LP</span>
							</li>
							<li className="flex items-baseline justify-between">
								<span className="text-muted-foreground">100 – 299</span>
								<span className="font-semibold">200 LP</span>
							</li>
							<li className="flex items-baseline justify-between">
								<span className="text-muted-foreground">300 – 399</span>
								<span className="font-semibold">350 LP</span>
							</li>
							<li className="flex items-baseline justify-between">
								<span className="text-muted-foreground">400+</span>
								<span className="font-semibold text-spykar-red">400 LP</span>
							</li>
						</ul>
						<p className="mt-3 text-[11px] text-muted-foreground">
							Catch denim only — score caps at 500. Accessories &amp; bombs
							deduct points.
						</p>
					</div>
				</div>
			</section>

			<footer className="relative z-10 mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground">
				Phase 1 MVP — products are mocked. Phase 2 plugs into Shopify Storefront
				API.
			</footer>
		</main>
	);
}
