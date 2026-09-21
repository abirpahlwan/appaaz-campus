// @ts-nocheck
/* ==================================================================
   appaaz; Campus - CONTENT
   Every readable panel on the campus lives here. Each object keeps the id,
   kind, tile and size of the world slot it sits in; only the words change.
   Project facts come from the appaaz site (lib/projects-data.ts).
   ================================================================== */
export const CONTENT = {
  name: "appaaz;",
  role: "Software development company \u00b7 Bangladesh | Germany",
  tagline: "A walkable solarpunk campus \u2014 explore what we build, how we work and who we are. Walk in through any door \u2014 the roof comes off.",
  blurb: "appaaz; is a software development company with teams in Bangladesh and Germany. We build web, mobile and AI products for clients across Asia-Pacific, North America and the Middle East. This is the same story as the campus, as plain text.",

  objects: [
    /* ================= WELCOME ================= */
    {
      id:"about", kind:"desk", tile:[7,7], w:4, h:2, label:"Front desk",
      title:"Welcome to appaaz;", tag:"the front desk",
      html:`
        <h3>Who we are</h3>
        <p>appaaz; is a software development company with teams in Bangladesh and Germany.
        We build web, mobile and AI products for clients across Asia-Pacific, North America and
        the Middle East \u2014 from startups to established brands.</p>
        <h3>What we build</h3>
        <ul>
          <li>Web development &mdash; responsive, modern web applications</li>
          <li>Mobile apps &mdash; native iOS and Android</li>
          <li>Cloud solutions &mdash; scalable infrastructure</li>
          <li>AI integration &mdash; machine-learning solutions</li>
          <li>Data analytics &mdash; actionable business insight</li>
          <li>Game development &mdash; engaging gaming experiences</li>
        </ul>
        <h3>How to explore</h3>
        <p>Walk through a lit doorway and the roof lifts off. Stand next to anything glowing and press
        <b>E</b>. The project gallery is the big hall on the top row.</p>
        <p><a class="store" href="https://appaaz.com" target="_blank" rel="noopener">appaaz.com &rarr;</a></p>`
    },

    /* ================= PROJECT GALLERY ================= */
    {
      id:"c1", kind:"arcade", tile:[22,6], w:2, h:3, label:"Noor Hajj BD", accent:"#33a094",
      title:"Noor Hajj BD", tag:"web \u00b7 Next.js \u00b7 2025",
      html:`
        <h3>What it is</h3>
        <p>A government-licensed Hajj and Umrah travel platform for Bangladeshi pilgrims, with
        multi-tier packages, airline partnerships and round-the-clock support.</p>
        <h3>What we built</h3>
        <ul>
          <li>Package management from Economy to VIP</li>
          <li>Airline partnership integrations and visa documentation flow</li>
          <li>Accommodation booking for Mecca and Medina</li>
          <li>Testimonials and a 24/7 support system</li>
        </ul>
        <h3>Stack</h3>
        <p>Next.js, React, TypeScript, Tailwind CSS, Vercel.</p>
        <p><a class="store" href="https://www.noorhajjbd.com/" target="_blank" rel="noopener">noorhajjbd.com &rarr;</a></p>`
    },
    {
      id:"c2", kind:"arcade", tile:[26,6], w:2, h:3, ldy:-10, label:"Penny Rounding", accent:"#ffb13b",
      title:"Penny Rounding Calculator Pro", tag:"mobile \u00b7 React Native \u00b7 2024",
      html:`
        <h3>What it is</h3>
        <p>A cross-platform utility app that rounds any amount to the nearest five cents, built for
        retailers and transit systems in penny-free economies.</p>
        <h3>What we built</h3>
        <ul>
          <li>Instant rounding with the correct up/down rules</li>
          <li>A clean, fast interface for daily use</li>
          <li>No user data collection, fully private</li>
          <li>Optional Pro features</li>
        </ul>
        <h3>Stack</h3>
        <p>React Native, Expo, iOS and Android.</p>
        <p>
          <a class="store" href="https://play.google.com/store/apps/details?id=com.appaaz.pennyroundingcalculatorpro" target="_blank" rel="noopener">Google Play &rarr;</a>
          <a class="store" href="https://apps.apple.com/ie/app/penny-rounding-calculator-pro/id6757429493" target="_blank" rel="noopener">App Store &rarr;</a>
        </p>`
    },
    {
      id:"cb", kind:"arcade", tile:[30,6], w:2, h:3, label:"propDNA.ai", accent:"#c77dff",
      title:"propDNA.ai", tag:"web \u00b7 AI \u00b7 Next.js \u00b7 2025",
      html:`
        <h3>What it is</h3>
        <p>An AI platform that turns property details into investor-ready video pitches and slide
        decks, with lifelike avatars and voiceovers.</p>
        <h3>What we built</h3>
        <ul>
          <li>AI video presentations with custom voiceovers</li>
          <li>Slide-deck generation from property data</li>
          <li>Voice cloning and multi-language support</li>
          <li>A project dashboard with file sharing</li>
        </ul>
        <h3>Stack</h3>
        <p>Next.js, React, TypeScript, AI/ML and video generation.</p>
        <p><a class="store" href="https://propdna.ai/" target="_blank" rel="noopener">propdna.ai &rarr;</a></p>`
    },
    {
      id:"c3", kind:"arcade", tile:[34,6], w:2, h:3, label:"SubRobin", accent:"#4cc9f0",
      title:"SubRobin", tag:"SaaS \u00b7 AI \u00b7 Stripe \u00b7 2025",
      html:`
        <h3>What it is</h3>
        <p>An AI-powered subscription platform: describe your business, get three optimised tiers, a
        branded storefront and Stripe payments, in minutes.</p>
        <h3>What we built</h3>
        <ul>
          <li>AI-generated subscription tiers with smart pricing</li>
          <li>Branded storefronts on custom domains</li>
          <li>Stripe-powered global payment collection</li>
          <li>Real-time revenue analytics, an embeddable widget and QR codes</li>
        </ul>
        <h3>Stack</h3>
        <p>Next.js, React, Stripe, PostgreSQL, AI/ML.</p>
        <p><a class="store" href="https://www.subrobin.com/" target="_blank" rel="noopener">subrobin.com &rarr;</a></p>`
    },
    {
      id:"c5", kind:"arcade", tile:[38,6], w:2, h:3, label:"BILIAI", accent:"#ff6b6b",
      title:"BILIAI", tag:"web \u00b7 AI \u00b7 retail commerce \u00b7 2024",
      html:`
        <h3>What it is</h3>
        <p>An AI-powered retail commerce platform for FMCG brands in Bangladesh, from dark
        warehousing to last-mile delivery, with AI sales insights.</p>
        <h3>What we built</h3>
        <ul>
          <li>Dark warehousing with real-time inventory insight</li>
          <li>A digital sales app for order taking and tracking</li>
          <li>Bili GPT: AI-driven sales and trend analysis</li>
          <li>BNPL invoicing with AI credit scoring</li>
        </ul>
        <h3>Stack</h3>
        <p>React, Node.js, PostgreSQL, AI/ML and mobile apps.</p>
        <p><a class="store" href="https://biliai.com.bd/" target="_blank" rel="noopener">biliai.com.bd &rarr;</a></p>`
    },
    {
      id:"play", kind:"arcade", tile:[42,6], w:2, h:3, label:"East London Eats", accent:"#7ee787",
      title:"East London Eats", tag:"web \u00b7 Next.js \u00b7 2025",
      html:`
        <h3>What it is</h3>
        <p>A direct-to-consumer meal-prep delivery service for London: chef-prepared,
        dietitian-approved meals on flexible weekly plans.</p>
        <h3>What we built</h3>
        <ul>
          <li>A rotating weekly menu with 50+ monthly options</li>
          <li>Dietary filtering: Keto, Vegan, Paleo, Gluten-Free and more</li>
          <li>Flexible subscription and delivery management</li>
          <li>Promotions and discount management</li>
        </ul>
        <h3>Stack</h3>
        <p>Next.js, React, TypeScript, Tailwind CSS, Vercel.</p>
        <p><a class="store" href="https://east-london-eats.vercel.app/" target="_blank" rel="noopener">east-london-eats.vercel.app &rarr;</a></p>`
    },

    /* ================= CLOUD ================= */
    {
      id:"systems", kind:"rack", tile:[53,6], w:4, h:3, label:"Cloud rack",
      title:"Cloud solutions", tag:"infrastructure \u00b7 deployment",
      html:`
        <p>Every product needs a reliable layer underneath it. We design and run scalable cloud
        infrastructure for the apps we build.</p>
        <h3>What we use</h3>
        <ul>
          <li>AWS for hosting and managed services</li>
          <li>Docker for repeatable environments</li>
          <li>Vercel for fast web deployment and previews</li>
          <li>PostgreSQL, MySQL, MongoDB, Redis and Supabase for data</li>
        </ul>
        <h3>How we work</h3>
        <p>Small, frequent releases and version control on every project.</p>`
    },

    /* ================= SERVICES ================= */
    {
      id:"m1", kind:"arcade", tile:[7,19], w:2, h:3, label:"Web development", accent:"#33a094",
      title:"Web development", tag:"service \u00b7 responsive, modern web apps",
      html:`
        <p>Responsive, modern web applications, from marketing sites to full-stack platforms.</p>
        <h3>Typical stack</h3>
        <ul>
          <li>React and Next.js with TypeScript</li>
          <li>Laravel/PHP and Python/Django backends</li>
          <li>PostgreSQL or MySQL, with REST APIs</li>
        </ul>
        <p>See it in the gallery: Noor Hajj BD, East London Eats, SubRobin.</p>`
    },
    {
      id:"m2", kind:"arcade", tile:[11,19], w:2, h:3, ldy:-10, label:"Mobile apps", accent:"#ffb13b",
      title:"Mobile apps", tag:"service \u00b7 iOS and Android",
      html:`
        <p>Native iOS and Android applications, and cross-platform builds where they fit better.</p>
        <h3>Typical stack</h3>
        <ul>
          <li>React Native and Expo</li>
          <li>App Store and Google Play publishing</li>
          <li>Backends on Node.js, Laravel or Supabase</li>
        </ul>
        <p>See it in the gallery: Penny Rounding Calculator Pro, live on both stores.</p>`
    },
    {
      id:"m3", kind:"arcade", tile:[15,19], w:2, h:3, label:"AI integration", accent:"#c77dff",
      title:"AI integration", tag:"service \u00b7 machine-learning solutions",
      html:`
        <p>Practical machine-learning features inside real products, not demos.</p>
        <h3>What that looks like</h3>
        <ul>
          <li>Generative content: video, slides and pricing (propDNA.ai, SubRobin)</li>
          <li>AI insight over business data (Bili GPT in BILIAI)</li>
          <li>Scoring and automation inside existing workflows</li>
        </ul>`
    },
    {
      id:"m4", kind:"arcade", tile:[19,19], w:2, h:3, ldy:-10, label:"Data analytics", accent:"#4cc9f0",
      title:"Data analytics", tag:"service \u00b7 actionable insight",
      html:`
        <p>Turning the data your product already produces into decisions.</p>
        <h3>Examples</h3>
        <ul>
          <li>Real-time revenue dashboards (SubRobin)</li>
          <li>Inventory and sales visualisation (BILIAI)</li>
          <li>Reporting that non-technical teams can actually read</li>
        </ul>`
    },

    /* ================= TECH STACK ================= */
    {
      id:"craft", kind:"shelf", tile:[52,20], w:5, h:2, label:"Toolbox",
      title:"Our stack", tag:"the toolbox",
      html:`
        <h3>Languages</h3>
        <p>TypeScript, JavaScript, PHP, Python, SQL.</p>
        <h3>Frameworks</h3>
        <p>React, Next.js, React Native, Laravel, Django, NestJS.</p>
        <h3>Data</h3>
        <p>PostgreSQL, MySQL, MongoDB, Redis, Supabase.</p>
        <h3>Platforms and tools</h3>
        <p>AWS, Docker, Vercel, GitHub, Slack, JIRA, Trello.</p>
        <h3>Also on the shelf</h3>
        <p>Game development with Unity and Cocos, and AI/ML tooling.</p>`
    },

    /* ================= PROCESS ================= */
    {
      id:"xr", kind:"vrrig", tile:[7,33], w:3, h:2, label:"1 \u00b7 Discover",
      title:"1 \u00b7 Discover and scope", tag:"process \u00b7 step one",
      html:`
        <p>We start with your goal, not a feature list.</p>
        <ul>
          <li>Requirements workshop and user stories</li>
          <li>A clear scope, timeline and quotation</li>
          <li>Risks and unknowns named up front</li>
        </ul>`
    },
    {
      id:"ar", kind:"arbench", tile:[13,33], w:3, h:2, label:"2 \u00b7 Build",
      title:"2 \u00b7 Design and build", tag:"process \u00b7 step two",
      html:`
        <p>Small, shippable steps with agile delivery.</p>
        <ul>
          <li>Design and prototype before heavy build</li>
          <li>Regular demos and review builds</li>
          <li>Quality checks in every sprint</li>
        </ul>`
    },
    {
      id:"brand", kind:"cartridges", tile:[19,33], w:4, h:2, label:"3 \u00b7 Launch",
      title:"3 \u00b7 Launch and support", tag:"process \u00b7 step three",
      html:`
        <p>Shipping is the middle, not the end.</p>
        <ul>
          <li>Release to production, stores or your own hosting</li>
          <li>Hand-over, documentation and training</li>
          <li>Ongoing maintenance and improvements</li>
        </ul>`
    },

    /* ================= GLOBAL HUB ================= */
    {
      id:"exp", kind:"board", tile:[34,32], w:5, h:2, label:"Global hub",
      title:"Where we work", tag:"the map board",
      html:`
        <h3>Teams</h3>
        <p>Engineering teams in Bangladesh and Germany, coordinated as one distributed team with
        agile delivery standards.</p>
        <h3>Clients</h3>
        <p>Asia-Pacific, North America and the Middle East.</p>
        <h3>Working together</h3>
        <p>Overlapping working hours between Dhaka and Germany and shared boards in JIRA, Trello
        and Slack.</p>`
    },

    /* ================= TEAM ================= */
    {
      id:"side", kind:"trophy", tile:[40,34], w:3, h:2, label:"The team",
      title:"The people", tag:"the founders' shelf",
      html:`
        <ul>
          <li><b>Moontaha Harun Aanisha</b> &mdash; CEO and co-founder; leadership, strategy
          and quality</li>
          <li><b>Pahlwan Rabiul Islam</b> &mdash; CTO and co-founder; AI, AR/VR and games</li>
          <li><b>Khodadad Md Ziaul Huda</b> &mdash; COO and co-founder; full-stack engineering
          and business development</li>
        </ul>
        <p>Plus designers, engineers and consultants across both countries.</p>
        <p><a class="store" href="https://appaaz.com/team" target="_blank" rel="noopener">Meet the team &rarr;</a></p>`
    },

    /* ================= CONTACT ================= */
    {
      id:"contact", kind:"terminal", tile:[54,33], w:2, h:2, label:"Start a project",
      title:"Start a project", tag:"the terminal",
      html:`
        <p>Tell us what you want to build. We reply with questions, then a scoped proposal.</p>

        <h3>Send us a message</h3>
        <form class="cform" onsubmit="sendMail(event)">
          <input id="cSubject" type="text" placeholder="Subject" autocomplete="off">
          <textarea id="cBody" rows="4" placeholder="Your message\u2026"></textarea>
          <div class="cform-row">
            <button type="submit" class="cbtn">\u2709 Open in my email app</button>
            <button type="button" class="cbtn ghost" onclick="copyEmail(this)">Copy address</button>
          </div>
          <p class="chint">This opens your own mail app with the message ready to send \u2014 nothing
          is submitted to a server.</p>
        </form>

        <h3>Elsewhere</h3>
        <ul>
          <li>Email &mdash; <a href="mailto:hello@appaaz.com">hello@appaaz.com</a></li>
          <li>Website &mdash; <a href="https://appaaz.com" target="_blank" rel="noopener">appaaz.com</a></li>
          <li>LinkedIn &mdash; <a href="https://www.linkedin.com/company/appaaz" target="_blank" rel="noopener">linkedin.com/company/appaaz</a></li>
          <li>Facebook &mdash; <a href="https://www.facebook.com/appaazhq" target="_blank" rel="noopener">facebook.com/appaazhq</a></li>
          <li>Instagram &mdash; <a href="https://www.instagram.com/appaazhq" target="_blank" rel="noopener">instagram.com/appaazhq</a></li>
          <li>X &mdash; <a href="https://x.com/appaazhq" target="_blank" rel="noopener">x.com/appaazhq</a></li>
        </ul>`
    },

    /* ================= NOTICE BOARD (first ad slot, placeholder) ================= */
    {
      id:"blog", kind:"noticeboard", tile:[31,24], w:3, h:2, label:"Notice board", outdoor:true,
      title:"Notice board", tag:"announcements \u00b7 sponsor space",
      html:`
        <p>This board is reserved for appaaz; announcements and partner spotlights.</p>
        <h3>Now open for projects</h3>
        <p>Web, mobile and AI builds. Walk to the terminal in the
        south-east to start.</p>
        <p style="color:var(--ink-dim)">Sponsor slot: your message could go here.</p>`
    },

    /* ================= LANDMARKS ================= */
    {
      id:"railway", kind:"landmark", tile:[70,47], w:3, h:2, label:"Delivery line", accent:"#e07b3c",
      title:"The delivery line", tag:"landmark \u00b7 how we ship",
      html:`
        <p>Regular, small releases keep projects moving and risk low. You always see what is
        next, and what just shipped.</p>`
    },
    {
      id:"aircraft", kind:"landmark", tile:[73,53], w:3, h:2, label:"Airfield", accent:"#4cc9f0",
      title:"The airfield", tag:"landmark \u00b7 global reach",
      html:`
        <p>Clients in Asia-Pacific, North America and the Middle East, served by teams in Bangladesh
        and Germany.</p>`
    },
    {
      id:"rocket", kind:"landmark", tile:[82,53], w:2, h:3, label:"Launchpad", accent:"#c77dff",
      title:"The launchpad", tag:"landmark \u00b7 new products",
      html:`
        <p>MVPs and new products, from idea to first paying users. SubRobin and propDNA.ai both
        started here.</p>`
    },
    {
      id:"mountain", kind:"landmark", tile:[76,8], w:2, h:2, label:"Summit", accent:"#9aa7b4",
      title:"The summit", tag:"landmark \u00b7 scale",
      html:`
        <p>Platforms that grow with the business, like BILIAI, which supports FMCG brands from
        warehouse to last-mile delivery.</p>`
    },
    {
      id:"dam", kind:"landmark", tile:[43,30], w:2, h:2, label:"The dam", accent:"#35bfb0",
      title:"The dam", tag:"landmark \u00b7 reliability",
      html:`
        <p>Good infrastructure is quiet: backups, monitoring and safe deployments so traffic
        spikes are a good problem to have.</p>`
    },
    {
      id:"garden", kind:"landmark", tile:[20,48], w:2, h:2, label:"Garden", accent:"#7ee787",
      title:"The garden", tag:"landmark \u00b7 care after launch",
      html:`
        <p>Software needs tending. We stay on after launch with fixes, updates and steady
        improvements.</p>`
    }
  ]
};
