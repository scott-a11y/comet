export default function MarketingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-slate-100">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 py-24">
                    <div className="text-center">
                        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            Design the Perfect Shop Layout
                        </h1>
                        <p className="text-2xl text-slate-300 mb-4">
                            Reduce worker movement by 60% and increase throughput by 25%
                        </p>
                        <p className="text-xl text-slate-400 mb-8">
                            AI-powered lean optimization for woodworking and cabinet shops
                        </p>
                        <div className="flex gap-4 justify-center">
                            <a
                                href="/buildings/new"
                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-blue-500/50"
                            >
                                Start Free Trial
                            </a>
                            <a
                                href="#features"
                                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-lg transition-all"
                            >
                                See Features
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-slate-900/50 backdrop-blur border-y border-slate-700/50 py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-5xl font-bold text-blue-400 mb-2">60%</div>
                            <div className="text-slate-400">Less Worker Movement</div>
                        </div>
                        <div>
                            <div className="text-5xl font-bold text-green-400 mb-2">25%</div>
                            <div className="text-slate-400">Higher Throughput</div>
                        </div>
                        <div>
                            <div className="text-5xl font-bold text-purple-400 mb-2">$187K</div>
                            <div className="text-slate-400">Annual Savings</div>
                        </div>
                        <div>
                            <div className="text-5xl font-bold text-cyan-400 mb-2">33x</div>
                            <div className="text-slate-400">ROI</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div id="features" className="py-24">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-16 text-slate-100">
                        Everything You Need to Optimize Your Shop
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: '🏗️', title: '3D Shop Layout', desc: 'Design your shop in 3D with AI-powered equipment placement' },
                            { icon: '📊', title: 'Lean Analysis', desc: 'Workflow optimization, spaghetti diagrams, and lean scoring' },
                            { icon: '📋', title: 'Kanban Inventory', desc: 'Visual inventory management with QR codes and reorder alerts' },
                            { icon: '🌱', title: 'Kaizen Tracking', desc: 'Track continuous improvements and measure ROI over time' },
                            { icon: '🏷️', title: 'QR Code Labels', desc: 'Printable labels for bins, racks, and equipment' },
                            { icon: '🛒', title: 'Equipment Marketplace', desc: 'Buy equipment with verified compatibility' },
                            { icon: '📝', title: 'SOP Builder', desc: 'Create photo-based standard operating procedures' },
                            { icon: '✅', title: 'Quality Tracking', desc: 'Track defects and identify Top 3 issues automatically' },
                            { icon: '🗺️', title: 'Store Layout Map', desc: 'Visual warehouse map with bin locations' },
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-700/50 p-6 hover:border-blue-500/50 transition-all">
                                <div className="text-5xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-slate-100 mb-2">{feature.title}</h3>
                                <p className="text-slate-400">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-slate-900/50 backdrop-blur py-24">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-16 text-slate-100">
                        Simple, Transparent Pricing
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { name: 'Free', price: '$0', features: ['Basic layout', '1 building', 'Community support'] },
                            { name: 'Pro', price: '$99', features: ['AI optimization', 'BOM generation', '3D visualization', 'Unlimited buildings'] },
                            { name: 'Lean', price: '$149', popular: true, features: ['Everything in Pro', 'Workflow analysis', 'Kanban inventory', 'QR labels', 'Store layout'] },
                            { name: 'Premium', price: '$249', features: ['Everything in Lean', 'Kaizen tracking', 'SOP builder', 'Quality tracking', 'Priority support'] },
                        ].map((tier, idx) => (
                            <div key={idx} className={`bg-slate-800/50 rounded-xl border-2 p-6 ${tier.popular ? 'border-blue-500 scale-105' : 'border-slate-700'}`}>
                                {tier.popular && (
                                    <div className="text-center mb-4">
                                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                            Most Popular
                                        </span>
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold text-slate-100 mb-2">{tier.name}</h3>
                                <div className="text-4xl font-bold text-blue-400 mb-6">
                                    {tier.price}<span className="text-lg text-slate-500">/mo</span>
                                </div>
                                <ul className="space-y-3 mb-6">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-slate-300">
                                            <span className="text-green-400">✓</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all">
                                    Get Started
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-24">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6 text-slate-100">
                        Ready to Transform Your Shop?
                    </h2>
                    <p className="text-xl text-slate-400 mb-8">
                        Join hundreds of woodworking shops saving time and money with Comet
                    </p>
                    <a
                        href="/buildings/new"
                        className="inline-block px-12 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold text-xl transition-all shadow-lg hover:shadow-blue-500/50"
                    >
                        Start Your Free Trial
                    </a>
                </div>
            </div>
        </div>
    );
}
