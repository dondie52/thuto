export const PAGE_CONTENT_META = [
  { pageKey: "landing", label: "Landing page" },
  { pageKey: "home", label: "App home" },
  { pageKey: "sponsorships", label: "Sponsorships" },
  { pageKey: "internships", label: "Internships" },
  { pageKey: "postgraduateStudies", label: "Postgraduate Studies" },
  { pageKey: "study", label: "BGCSE Study" },
  { pageKey: "support", label: "Support" },
  { pageKey: "disclaimer", label: "Disclaimer" },
  { pageKey: "privacy", label: "Privacy" },
  { pageKey: "thutoCenterPolicy", label: "Thuto Center policy" },
  { pageKey: "upgrade", label: "Upgrade" },
  { pageKey: "partners", label: "Partners" },
];

export const PAGE_CONTENT_DEFAULTS = {
  landing: {
    hero: {
      kicker: "Thuto - Botswana Tertiary Companion",
      title: "Check what your BGCSE results may qualify you for",
      body: "Start with real or estimated grades, see possible programme matches, and spot requirements to confirm before applications open.",
      primaryCtaLabel: "Check eligibility",
      secondaryCtaLabel: "Browse programmes",
      note: "Thuto is planning guidance, not an admission decision. Always confirm final requirements with each institution.",
      image: "programme-themes/landing-hero-bw.jpg",
      stats: [
        { value: "55+", label: "institutions" },
        { value: "Best six", label: "BGCSE scoring" },
        { value: "Shareable", label: "programme compare" },
      ],
    },
    problem: {
      heading: "Choosing a course shouldn't be guesswork",
      items: [
        "Many students are unsure which programmes their BGCSE points qualify for.",
        "Comparing requirements across universities takes too much time.",
        "Career paths and course details are often difficult to find before applying.",
      ],
    },
    howItWorks: {
      heading: "How it works",
      steps: [
        { title: "Enter your BGCSE results", body: "Add your subjects and grades to calculate your points.", icon: "results" },
        { title: "Explore matching programmes", body: "See programmes that may match your points and subjects.", icon: "chart" },
        { title: "Compare your options", body: "Review modules, careers, and requirements before applying.", icon: "compare" },
      ],
    },
    features: {
      introHeading: "Apply with more confidence",
      introBody: "Instead of opening multiple university websites and guessing where you qualify, check your eligibility first and use that result to build a clearer shortlist.",
      heading: "Built for Botswana applicants",
      body: "Designed for students comparing universities and programmes across Botswana.",
      items: [
        { title: "Admission predictor", body: "Start with real or estimated BGCSE grades and see programmes you may qualify for.", to: "/predictor", guestHash: "#features", icon: "predictor" },
        { title: "Programme explorer", body: "Browse programmes, requirements, careers, and modules in one place.", to: "/programmes", guestHash: "#programmes", icon: "programmes" },
        { title: "University profiles", body: "Compare institutions, locations, and application timelines.", to: "/universities", guestHash: "#universities", icon: "universities" },
        { title: "Course comparison", body: "Compare up to two programmes free, or three with Pro.", to: "/compare", guestHash: "#programmes", icon: "compare" },
      ],
    },
    examples: {
      heading: "Example programmes",
      body: "With 44 points, you may qualify for programmes like these in the Thuto sample directory. Check your own grades first, because subject requirements still apply.",
      signedInCta: "View programme ->",
      guestCta: "Review examples ->",
      programmeIds: ["ub-bsc-cs", "biust-bsc-data", "bac-bcom-accounting"],
    },
    universities: {
      kicker: "University directory",
      heading: "Compare institutions across Botswana.",
      body: "Browse universities and training institutions, then jump straight into their programmes.",
      featuredLabel: "Featured",
      badgeSuffix: "logos",
      ctaSignedIn: "View all universities",
      ctaGuest: "Explore universities",
      note: "Profiles include locations, programmes, and application timing.",
      featuredUniversityIds: [
        "ub",
        "biust",
        "buan",
        "botho",
        "ba-isago",
        "bou",
        "limkokwing",
        "bac",
        "fctve",
        "boitekanelo",
        "abm",
        "new-era",
        "naledi-training-institute",
      ],
    },
    cta: {
      heading: "Check eligibility before you build your shortlist",
      body: "Use real or estimated grades to get an indicative match list, then save or compare the programmes worth a closer look.",
      buttonLabel: "Check eligibility",
    },
    about: {
      heading: "About Thuto",
      paragraphs: [
        "Thuto is a Botswana-built social education technology platform designed to provide accurate information about tertiary education in Africa.",
        "We help prospective students explore higher education options, predict their admission chances, and make confident decisions about their future, all in one place. From discovering the right programme to comparing institutions and connecting with opportunities and other students, Thuto puts the information and tools every student needs directly in their hands.",
        "We believe no student should miss out on the right opportunity simply because they didn't have access to the right information.",
        "For institutions and partners, Thuto represents direct access to Botswana's next generation of qualified, motivated students, already researching, already deciding.",
      ],
    },
    partnersTeaser: {
      heading: "Partner with Thuto",
      body: "Universities, employers, and education organisations can reach motivated students already researching their next step.",
      ctaLabel: "Explore partnerships",
      to: "/partners",
    },
    footer: {
      brand: "Thuto",
      tagline: "Botswana Tertiary Companion",
      signedInCta: "Open full app",
      guestCta: "See app features",
      note: "Thuto does not process applications or payments. Eligibility and programme details in the app are indicative; confirm with each university.",
    },
  },
  home: {
    hero: {
      kicker: "Thuto - BTC",
      title: "Check what your BGCSE results may qualify you for",
      body: "Start with your grades, get indicative programme matches, and use the result to build a shortlist before you confirm details with each institution.",
      ctaLabel: "Check eligibility",
    },
    cards: {
      heading: "Get started",
      items: [
        { to: "/predictor", title: "Check eligibility", body: "Start with real or estimated BGCSE grades and see which programmes you may qualify for." },
        { to: "/fit-finder", title: "Programme fit finder", body: "Match your grades and interests to programmes - strong picks, alternatives, and stretch ideas." },
        { to: "/center", title: "Thuto Center", body: "Upload notes and past papers, or unlock campus study materials from other Botswana students." },
        { to: "/feed", title: "Scroll Feed", body: "Browse useful student posts, opportunities, questions, tips, and notices after AI moderation." },
        { to: "/programmes", title: "Programmes", body: "Browse courses, entry requirements, modules, and career ideas." },
        { to: "/saved", title: "Saved programmes", body: "Shortlist favourites on this device and jump back to them anytime." },
        { to: "/compare", title: "Compare programmes", body: "Select up to two programmes on Free, or three on Pro, in a shareable side-by-side table." },
        { to: "/universities", title: "Tertiary Institutions", body: "Institutions, locations, and application windows." },
        { to: "/sponsorships", title: "Sponsorships & funding", body: "Government sponsorship steps, private sponsor posts, and other funding routes." },
        { to: "/internships", title: "Internships", body: "Latest internship windows copied from official posts - apply on the original channel." },
        { to: "/postgraduate-studies", title: "Postgraduate Studies", body: "Master's and PhD programmes, plus scholarship updates for postgraduate students." },
        { to: "/study", title: "BGCSE Study", body: "Revision links via Learning Passport, free resources, and which programmes need each subject." },
      ],
    },
  },
  study: {
    hero: {
      kicker: "BGCSE Study",
      title: "Revise for exams, plan for university",
      body: "A bridge between BGCSE revision and tertiary planning. Thuto links to official Learning Passport content and shows which programmes depend on each subject — we do not host curriculum materials here.",
    },
    featured: {
      heading: "Official revision platforms",
      body: "Open these resources in your browser or the Learning Passport app. Sign in with your school username where required.",
      attribution: "Content on Learning Passport is provided by the Ministry of Education and Skills Development, UNICEF, and Microsoft.",
    },
    subjects: {
      heading: "BGCSE subjects",
      body: "Pick a subject for revision links, study tips, and related university programmes in Thuto.",
    },
    verify: {
      title: "Tie revision to your admission plan",
      body: "After studying, enter your grades in the Predictor to see which programmes you may qualify for.",
      linkLabel: "Open Predictor",
    },
    footerNote: "Thuto does not host curriculum content. External links open official platforms.",
  },
  sponsorships: {
    hero: {
      kicker: "Sponsorships",
      title: "Funding routes",
      body: "A first home for sponsorship notes, deadlines, and funding paths linked to Botswana study options. Thuto does not submit applications to funders - use the official portals and call centres below.",
      portalTitle: "Online Tertiary Education Sponsorship",
      portalNote: "Illustrative mark only - not an official Government of Botswana crest.",
    },
    fundingRoutes: {
      items: [
        { title: "Government sponsorship", body: "Public windows and required documents for national sponsorship schemes, including the DTEF online portal for new students.", icon: "government" },
        { title: "Institution scholarships", body: "Keep an eye on university-funded awards, merit support, and programme-specific funding notices.", icon: "campus" },
        { title: "Private and employer support", body: "Plan for bursaries, workplace support, and sector-linked funding where a programme connects to a sponsor.", icon: "briefcase" },
      ],
    },
    privateSponsorships: {
      kicker: "Private & sector",
      heading: "Private sponsorship updates",
      body: "BDF, employers, and other private sponsors - summaries from their official posts. No in-app applications.",
      emptyTitle: "No private sponsorship posts yet",
      emptyBody: "When a sponsor like BDF publishes a window, add it in Supabase and it will appear here.",
      internshipLinkText: "See internships",
      internshipPrefix: "Looking for internship openings?",
    },
    dtef: {
      portalUrl: "https://tef.gov.bw",
      kicker: "Botswana - DTEF",
      heading: "Tertiary education government sponsorship",
      subheading: "2025/2026 intake - New students - Public application summary",
      intro: "The steps below summarise the public application process published for the Online Tertiary Education Sponsorship portal. Always confirm deadlines, wording, and requirements on the official site or with DTEF before you act.",
      portalButtonLabel: "Open official portal",
      warningTitle: "Website security",
      warningBody: "Browsers may warn you if the portal certificate is expired or invalid. If you see a security warning, avoid entering passwords until the site is fixed or use the contact numbers below to confirm how DTEF wants applicants to proceed.",
      contactsHeading: "For enquiries",
      contactsNote: "Call-centre row dials the first listed number on tap-to-call devices; use the other extensions from a landline or full national number if needed.",
      contacts: [
        { label: "Enquiries", detail: "Weekdays 07:30-16:30", tel: "" },
        { label: "Toll-free", detail: "0800 600 185", tel: "tel:+267800600185" },
        { label: "Call centre", detail: "371 9364 / 371 9439 / 371 9441 / 371 9473", tel: "tel:+2673719364" },
        { label: "PR office", detail: "371 9319", tel: "tel:+2673719319" },
        { label: "Switchboard", detail: "371 9300 / 371 9301", tel: "tel:+2673719300" },
      ],
      stepsHeading: "Application steps",
      steps: [
        { title: "Online log-in and sign up", body: "Visit the Online Tertiary Education Sponsorship portal, choose Sign Up, complete your details, enter a valid email, then select Create New Account." },
        { title: "Verify your email", body: "Open the DTEF message in your inbox, follow the instructions, create your password, then sign in with that password." },
        { title: "Apply", body: "After logging in, select Apply for Sponsorship." },
        { title: "Choose the application type", body: "Under Applications and beneficiary, open the New student sub-tab." },
        { title: "Complete the form and attach documents", body: "Enter all relevant details, choose the correct category of sponsorship, and upload supporting documents as PDF, JPEG, PNG, or JPG." },
        { title: "Sign the declaration", body: "Tick the Student Declaration box to accept the application requirements." },
        { title: "Review the application", body: "Select Review and read everything carefully before final submission." },
        { title: "Submit", body: "Choose Submit so your application can be assessed." },
        { title: "Confirmation of submission", body: "Expect a confirmation or acknowledgement message in the email you registered." },
        { title: "View and print", body: "You can open the submitted application form and acknowledgement to print copies for your records." },
        { title: "Check application status", body: "Sign in, choose Submissions, and review the status of each submitted application whenever you need an update." },
        { title: "Accept the sponsorship agreement", body: "If you qualify and receive an offer, accept it to read the DTEF sponsorship agreement." },
      ],
    },
    verify: {
      title: "Verify before you rely on this page",
      body: "Sponsorship rules change. Cross-check every detail with official DTEF notices, the live portal, or the call centre numbers above.",
      linkLabel: "Check university profiles",
    },
  },
  internships: {
    hero: {
      kicker: "Internships",
      title: "Latest openings",
      body: "Short updates copied from official pages and social posts - employers, ministries, and private organisations. Thuto does not accept applications here; follow each post to apply on the original channel.",
    },
    announcements: {
      heading: "Announcements",
      body: "Newest posts first. Expired windows are hidden automatically.",
      emptyTitle: "No internship posts yet",
      emptyBody: "When an opportunity is published, it will show up here with details and a flyer image.",
    },
    verify: {
      title: "Verify on the official source",
      body: "Deadlines and requirements can change after a post goes live. Always confirm on the employer's website or social page before you apply.",
      linkLabel: "Private sponsorship posts",
    },
  },
  postgraduateStudies: {
    hero: {
      kicker: "Postgraduate Studies",
      title: "Master's, PhD, and funding",
      body: "A dedicated space for postgraduate programmes and scholarship updates — separate from undergraduate BGCSE planning. Browse taught and research degrees, then check funding posts aimed at Master's and PhD applicants.",
    },
    programmes: {
      heading: "Master's and PhD programmes",
      body: "These programmes sit outside the main BGCSE eligibility flow. Open a list to compare entry routes, institutions, and career outcomes.",
      mastersTitle: "Master's and taught postgraduate",
      mastersBody: "MBA, MSc, PGD, and other taught postgraduate programmes listed in Thuto.",
      phdTitle: "PhD and research degrees",
      phdBody: "Doctoral and MPhil routes where listed. Many research programmes are published on graduate school pages — confirm details with each institution.",
      fitFinderPrefix: "Not sure where to start?",
      fitFinderLinkText: "Try Fit Finder with a postgraduate qualification level",
    },
    scholarships: {
      heading: "Postgraduate scholarship updates",
      body: "Funding notices for Master's and PhD applicants only — not undergraduate DTEF or school-leaver bursaries. Newest posts first.",
      emptyTitle: "No postgraduate scholarship posts yet",
      emptyBody: "When a university or sponsor publishes a Master's or PhD funding window, it will appear here.",
    },
    verify: {
      title: "Verify on the official source",
      body: "Postgraduate entry rules and funding deadlines change often. Always confirm on the graduate school page or sponsor's official notice before you apply.",
      linkLabel: "Undergraduate sponsorship routes",
    },
  },
  support: {
    hero: {
      kicker: "Support",
      title: "Support and feedback",
      body: "Share what is confusing, missing, or useful as Thuto grows into a stronger tertiary companion.",
    },
    form: {
      topicLabel: "Topic",
      messageLabel: "Message",
      contactLabel: "Contact email",
      contactPlaceholder: "Optional, if you want a reply.",
      messagePlaceholder: "Tell us what happened or what would help.",
      buttonLabel: "Send feedback",
      onlineStatus: "Feedback sent to the Thuto team.",
      offlineStatus: "Feedback saved locally for now. Send it to the Thuto team when support intake is connected.",
      topics: [
        { value: "feedback", label: "General feedback" },
        { value: "bug", label: "Something is not working" },
        { value: "data", label: "Programme or deadline data" },
        { value: "account", label: "Account help" },
      ],
    },
    account: {
      heading: "Account context",
      signedOut: "You are not signed in. Feedback is still welcome.",
      loginLabel: "Log in",
    },
  },
  disclaimer: {
    heading: "Disclaimer",
    paragraphs: [
      "Thuto (Botswana Tertiary Companion) provides programme information and rough eligibility estimates for planning purposes only. Minimum points, subject rules, fees, and deadlines in the app may be incomplete, out of date, or simplified compared with official university sources.",
      "Nothing in Thuto constitutes an offer of admission, legal advice, or a substitute for each institution's official prospectus, website, or admissions office. You are responsible for verifying every requirement before you apply or pay any fees.",
      "Thuto is an independent educational directory and is not affiliated, endorsed, or partnered with any listed university or examination council. While we strive to keep admission requirements and deadlines accurate, institutional details change frequently. Application dates and portals are provided solely for convenience. Users must verify all critical dates and submit official applications directly via the verified institutional websites opened through this application.",
      "Thuto accepts no liability for missed deadlines, outdated information, or application errors. Always confirm dates and requirements on the institution's official website before you apply.",
      "Thuto does not process university applications or tuition fees. We do not transmit application forms to universities on your behalf and do not collect institution application fees. Optional Thuto Pro plans are one-time payments billed through Stripe for in-app features.",
      "Thuto may use sample or bundled data in development; where live feeds are configured, treat them as convenience only and still confirm critical dates directly with the institution.",
      "Official prospectuses, calendars, and application guides linked in Thuto are hosted on institution servers. Thuto does not store, modify, or redistribute those documents.",
    ],
    contentRemoval: {
      heading: "IP & content removal",
      paragraphs: [
        "If you represent a listed institution and are uncomfortable with how your details, links, or references appear in Thuto, contact us at legal@thutoapp.com before pursuing formal action.",
        "We will review takedown or correction requests in good faith and respond as promptly as we can.",
      ],
    },
  },
  privacy: {
    heading: "Privacy",
    intro: "Thuto (Botswana Tertiary Companion) is a client-side web app. This page describes what we may collect when you use specific features.",
    sections: [
      {
        heading: "Community submissions",
        paragraphs: [
          "If you use Share your result, and the site operator has connected a Supabase project, your submission is sent to that database.",
          "New rows are intended to stay hidden from public reads until reviewed. Only aggregated, verified data should appear on programme pages.",
        ],
      },
      {
        heading: "Scroll Feed",
        paragraphs: [
          "If you use Scroll Feed, posts, images, comments, reactions, reports, moderation status, and your account user id may be stored in Supabase.",
          "Admins can remove, restore, approve, or reject feed content. Do not post private personal information or official-looking notices you cannot source.",
        ],
      },
      {
        heading: "Thuto Center",
        paragraphs: [
          "If you use Thuto Center, uploaded files, document metadata, unlock credits, helpful votes, policy acceptances, and download counts may be stored in Supabase.",
          "Your display name and university affiliation may appear on materials you upload. Downloads are logged for abuse prevention. See the Thuto Center Botswana policy for copyright and takedown rules.",
        ],
      },
      {
        heading: "Device storage",
        paragraphs: [
          "Bookmarks, compare selections, predictor inputs, and rate limits for the share form may be stored in your browser. This stays on your device unless you clear site data.",
        ],
      },
      {
        heading: "Thuto Pro and billing",
        paragraphs: [
          "If you purchase Thuto Pro, payment is processed by Stripe as a one-time charge (yearly or five-year access). We store your plan status in your Supabase profile.",
          "Pro may sync saved programmes and predictor snapshots to your account. Core programme browsing remains available on the free plan.",
        ],
      },
      {
        heading: "Third parties",
        paragraphs: [
          "Universities you open in a new tab set their own policies. Thuto does not process university application or tuition fees on your behalf.",
        ],
      },
    ],
  },
  upgrade: {
    hero: {
      kicker: "Thuto Pro",
      title: "Get Pro. Plan with confidence",
      body: "One-time payment from P59/year. No monthly billing. Unlock alerts, acceptance chance, PDF downloads, and unlimited AI.",
    },
    features: {
      heading: "Pro Features",
      items: [
        { key: "alerts", icon: "alerts", text: "Deadline & sponsorship alerts via WhatsApp, SMS, and push" },
        { key: "predictor", icon: "predictor", text: "Acceptance chance based on your grades" },
        { key: "support", icon: "support", text: "Email support (24hr) and WhatsApp team help" },
        { key: "pdf", icon: "pdf", text: "Download & share programme summaries for parents and teachers" },
        { key: "whatsapp", icon: "whatsapp", text: "Certificate photo/PDF import for grade auto-fill" },
        { key: "unlimited", icon: "spark", text: "Unlimited AI, saves, messaging anyone, and ad-free experience" },
        { key: "center", icon: "pdf", text: "Instant Thuto Center downloads — notes and past papers from other students" },
      ],
    },
  },
  partners: {
    hero: {
      kicker: "Thuto Partner Network",
      title: "Join the Thuto Partner Network",
      body: "Thuto is a Botswana-built social education technology platform. We give institutions, employers, and education partners direct access to students already researching programmes, comparing options, and deciding their next step.",
      primaryCtaLabel: "Book a demo",
      secondaryCtaLabel: "Claim your institution",
      image: "programme-themes/landing-hero-bw.jpg",
    },
    logos: {
      heading: "Institutions on Thuto",
      body: "Verified partners manage their own profiles. Other listings are informational until claimed.",
      featuredUniversityIds: ["ub", "biust", "buan", "botho", "bac", "bou", "limkokwing"],
    },
    why: {
      heading: "Why partner with Thuto",
      items: [
        {
          title: "Qualified student leads",
          body: "Reach students exploring programmes that match their results and subject choices.",
          icon: "leads",
        },
        {
          title: "Verified profiles",
          body: "Control how your institution appears with a self-service profile and programme editor.",
          icon: "verified",
        },
        {
          title: "Real-time analytics",
          body: "Track profile views, programme interest, and apply clicks from the partner dashboard.",
          icon: "analytics",
        },
        {
          title: "Featured placement",
          body: "Stand out in the Thuto directory and on landing surfaces during active campaigns.",
          icon: "spotlight",
        },
      ],
    },
    who: {
      heading: "Who can partner with Thuto",
      items: [
        {
          title: "Universities & colleges",
          body: "Claim your profile, publish accurate programme data, and capture student interest.",
          icon: "university",
        },
        {
          title: "TVET & training institutions",
          body: "Reach applicants comparing technical and vocational routes across Botswana.",
          icon: "tvet",
        },
        {
          title: "Employers & bursary sponsors",
          body: "Share funding windows and connect with students planning their study path.",
          icon: "employer",
        },
        {
          title: "NGOs & youth programmes",
          body: "Support underserved learners with accurate tertiary information in one place.",
          icon: "ngo",
        },
        {
          title: "Schools & counsellors",
          body: "Help learners build shortlists and compare requirements before applications open.",
          icon: "school",
        },
      ],
    },
    mission: {
      heading: "Our goal",
      highlight: "no student misses the right opportunity",
      body: "because they lacked access to the right information. Partner with Thuto to put accurate tertiary guidance directly in students' hands.",
      stats: [
        { value: "55+", label: "institutions listed" },
        { value: "Verified", label: "partner profiles" },
        { value: "Leads", label: "for growth tier" },
      ],
    },
    pricing: {
      heading: "Partner tiers",
      body: "Start with a verified profile during our pilot. Contact us for Insights, Spotlight, and Growth packages.",
      comparisonHeading: "Compare partner tiers",
      ctaLabel: "Talk to our team",
    },
    inquiry: {
      heading: "Book a demo",
      body: "Tell us about your organisation and we will follow up with a walkthrough of the partner portal.",
    },
    cta: {
      heading: "Ready to reach Botswana's next generation of students?",
      body: "Claim your institution profile or book a demo to explore analytics, featured placement, and lead capture.",
      primaryCtaLabel: "Book a demo",
      secondaryCtaLabel: "Claim your institution",
    },
  },
};

export function defaultsForPage(pageKey) {
  return PAGE_CONTENT_DEFAULTS[pageKey] || {};
}
