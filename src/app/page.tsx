import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-serif font-bold text-accent">
          VerseVault
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-ink dark:text-[#E8D5B8] hover:text-accent transition-colors">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto">
        <div className="verse-card mb-8 max-w-lg w-full">
          <p className="verse-text text-xl md:text-2xl leading-relaxed text-ink dark:text-[#E8D5B8]">
            &ldquo;Your word I have hidden in my heart, that I might not sin
            against You.&rdquo;
          </p>
        </div>
        <p className="text-sm text-accent font-serif mb-8">— Psalm 119:11 (NKJV)</p>

        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4 text-ink dark:text-[#E8D5B8]">
          Memorize Scripture.
          <br />
          <span className="text-accent">Remember it forever.</span>
        </h2>

        <p className="text-lg text-ink/70 dark:text-[#E8D5B8]/70 mb-8 max-w-2xl">
          VerseVault uses spaced repetition science and AI-powered tools to help
          you hide God&apos;s Word in your heart — one verse at a time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/signup" className="btn-primary text-lg px-8 py-3">
            Start Memorizing — Free
          </Link>
          <Link href="#features" className="btn-secondary text-lg px-8 py-3">
            See How It Works
          </Link>
        </div>
      </main>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-center mb-12">
            Five ways to drill your verses
          </h3>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { title: "Read", desc: "Read the verse and rate your confidence", icon: "📖" },
              { title: "Fill in the Blank", desc: "Missing words increase as you master it", icon: "✏️" },
              { title: "Prompt", desc: "See the reference, type the verse", icon: "💬" },
              { title: "First Letters", desc: "Only first letters shown as hints", icon: "🔤" },
              { title: "Recite", desc: "Blank canvas — type from memory", icon: "🧠" },
            ].map((mode) => (
              <div key={mode.title} className="verse-card flex-col gap-3 text-center p-6">
                <span className="text-3xl">{mode.icon}</span>
                <h4 className="font-serif font-semibold">{mode.title}</h4>
                <p className="text-sm text-ink/60 dark:text-[#E8D5B8]/60">{mode.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-20 px-6 bg-accent/5">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl md:text-3xl font-serif font-bold mb-4">
            AI-Powered Understanding
          </h3>
          <p className="text-ink/70 dark:text-[#E8D5B8]/70 mb-12">
            Powered by Claude, get deeper into every verse you memorize.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Explain This Verse", desc: "Historical context, meaning, and original language notes" },
              { title: "Help Me Remember", desc: "Vivid mnemonics and memory palace stories" },
              { title: "Quiz Me", desc: "Comprehension questions to deepen understanding" },
              { title: "Connect It", desc: "Discover 3 thematically related verses" },
            ].map((feat) => (
              <div key={feat.title} className="verse-card flex-col gap-2 text-left">
                <h4 className="font-serif font-semibold text-accent">{feat.title}</h4>
                <p className="text-sm text-ink/60 dark:text-[#E8D5B8]/60">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-sm text-ink/50 dark:text-[#E8D5B8]/50">
        <p>VerseVault — Hide God&apos;s Word in your heart.</p>
      </footer>
    </div>
  );
}
