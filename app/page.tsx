import Link from "next/link";
import { ArrowRight, Gamepad2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetPreloader } from "@/components/AssetPreloader";

/**
 * Landing page. Sits on the Game-BG-2 denim backdrop with white type. The
 * hero stacks on mobile (logo → copy → CTA → tier card) and runs two-column on
 * desktop with the tier card on the right. Visuals match the mobile mockups.
 */
export default function LandingPage() {
	return (
		<main
			className="relative min-h-screen overflow-hidden bg-cover bg-center text-white"
			style={{ backgroundImage: "url('/Game-BG-2.webp')" }}
		>
			{/* Start downloading game assets the moment the player lands. */}
			<AssetPreloader />

			{/* Soft tint to keep text legible regardless of local bg contrast. */}
			<div className="absolute inset-0 bg-spykar-ink/30" aria-hidden />

			{/* Decorative bands + glows */}
			<div className="absolute inset-x-0 top-0 z-10 h-1 bg-spykar-red" />
			<div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-spykar-red/20 blur-3xl" />
			<div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-spykar-red/10 blur-3xl" />

			{/* Header */}
			<header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
				<div className="flex items-center gap-2">
					<div className="rounded-md bg-white px-2 py-1 text-[11px] font-extrabold tracking-[0.25em] text-spykar-ink">
						SPYKAR
					</div>
					<span className="text-xs font-semibold uppercase tracking-widest text-white/80">
						×&nbsp;Feed&nbsp;Your&nbsp;Greed
					</span>
				</div>
				<nav className="flex items-center gap-2">
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
					{/* Wordmark image — replaces the text title in the mockup */}
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src="/Feed-Your-Greed-Logo-Unit.webp"
						alt="Feed Your Greed"
						className="h-auto w-full max-w-md select-none drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
						draggable={false}
					/>

					<p className="mt-5 max-w-md text-base text-white/90 sm:text-lg">
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
					</div>
				</div>

				{/* Loyalty reward tiers — kept light so they pop against the denim */}
				<div className="relative">
					<div className="rounded-lg border border-white/10 bg-white p-5 shadow-xl">
						<div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-muted-foreground">
							<Gift className="h-3.5 w-3.5 text-spykar-red" /> Loyalty reward
							tiers
						</div>
						<ul className="space-y-2 text-sm">
							<li className="flex items-baseline justify-between">
								<span className="text-muted-foreground">0 – 99</span>
								<span className="font-semibold text-spykar-ink">100 LP</span>
							</li>
							<li className="flex items-baseline justify-between">
								<span className="text-muted-foreground">100 – 299</span>
								<span className="font-semibold text-spykar-ink">200 LP</span>
							</li>
							<li className="flex items-baseline justify-between">
								<span className="text-muted-foreground">300 – 399</span>
								<span className="font-semibold text-spykar-ink">350 LP</span>
							</li>
							<li className="flex items-baseline justify-between">
								<span className="text-muted-foreground">400+</span>
								<span className="font-semibold text-spykar-red">500 LP</span>
							</li>
						</ul>
						<p className="mt-3 text-[11px] text-muted-foreground">
							Catch denim only — score caps at 500. Accessories &amp; bombs
							deduct points.
						</p>
					</div>
				</div>
			</section>

			<footer className="relative z-10 mx-auto max-w-6xl px-6 py-6 text-xs text-white/60">
				Phase 1 MVP — products are mocked. Phase 2 plugs into Shopify Storefront
				API.
			</footer>
		</main>
	);
}
