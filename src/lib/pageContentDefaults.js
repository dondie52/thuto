export const PAGE_CONTENT_META = [
  { pageKey: "landing", label: "Landing page" },
  { pageKey: "home", label: "App home" },
  { pageKey: "sponsorships", label: "Sponsorships" },
  { pageKey: "internships", label: "Internships" },
  { pageKey: "study", label: "BGCSE Study" },
  { pageKey: "support", label: "Support" },
  { pageKey: "disclaimer", label: "Disclaimer" },
  { pageKey: "privacy", label: "Privacy" },
  { pageKey: "upgrade", label: "Upgrade" },
];

export const PAGE_CONTENT_DEFAULTS = {
  landing: {
    hero: {
      kicker: "Thuto - Botswana University Companion",
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
        { title: "Course comparison", body: "Compare up to three programmes side by side.", to: "/compare", guestHash: "#programmes", icon: "compare" },
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
        "Thuto helps Botswana students use their BGCSE results to explore programmes they may qualify for before applying.",
        "Thuto does not process applications, accept payments, or replace official admissions offices. Use it to prepare questions and a shortlist - then confirm every detail on each institution's website or admissions desk.",
      ],
    },
    footer: {
      brand: "Thuto",
      tagline: "Botswana University Companion",
      signedInCta: "Open full app",
      guestCta: "See app features",
      note: "Thuto does not process applications or payments. Eligibility and programme details in the app are indicative; confirm with each university.",
    },
  },
  home: {
    hero: {
      kicker: "Thuto - BUC",
      title: "Check what your BGCSE results may qualify you for",
      body: "Start with your grades, get indicative programme matches, and use the result to build a shortlist before you confirm details with each institution.",
      ctaLabel: "Check eligibility",
    },
    cards: {
      heading: "Get started",
      items: [
        { to: "/predictor", title: "Check eligibility", body: "Start with real or estimated BGCSE grades and see which programmes you may qualify for." },
        { to: "/fit-finder", title: "Programme fit finder", body: "Match your grades and interests to programmes - strong picks, alternatives, and stretch ideas." },
        { to: "/feed", title: "Scroll Feed", body: "Browse useful student posts, opportunities, questions, tips, and notices after AI moderation." },
        { to: "/programmes", title: "Programmes", body: "Browse courses, entry requirements, modules, and career ideas." },
        { to: "/saved", title: "Saved programmes", body: "Shortlist favourites on this device and jump back to them anytime." },
        { to: "/compare", title: "Compare programmes", body: "Select up to three programmes and open a shareable side-by-side table." },
        { to: "/universities", title: "Tertiary Institutions", body: "Institutions, locations, and application windows." },
        { to: "/sponsorships", title: "Sponsorships & funding", body: "Government sponsorship steps, private sponsor posts, and other funding routes." },
        { to: "/internships", title: "Internships", body: "Latest internship windows copied from official posts - apply on the original channel." },
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
  support: {
    hero: {
      kicker: "Support",
      title: "Support and feedback",
      body: "Share what is confusing, missing, or useful as Thuto grows into a stronger university companion.",
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
      "Thuto (Botswana University Companion) provides programme information and rough eligibility estimates for planning purposes only. Minimum points, subject rules, fees, and deadlines in the app may be incomplete, out of date, or simplified compared with official university sources.",
      "Nothing in Thuto constitutes an offer of admission, legal advice, or a substitute for each institution's official prospectus, website, or admissions office. You are responsible for verifying every requirement before you apply or pay any fees.",
      "Thuto is an independent educational directory and is not affiliated, endorsed, or partnered with any listed university or examination council. While we strive to keep admission requirements and deadlines accurate, institutional details change frequently. Application dates and portals are provided solely for convenience. Users must verify all critical dates and submit official applications directly via the verified institutional websites opened through this application.",
      "Thuto accepts no liability for missed deadlines, outdated information, or application errors. Always confirm dates and requirements on the institution's official website before you apply.",
      "Thuto does not process university applications or tuition fees. We do not transmit application forms to universities on your behalf and do not collect institution application fees. Optional Thuto Premium subscriptions are billed through Stripe for in-app features.",
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
    intro: "Thuto (Botswana University Companion) is a client-side web app. This page describes what we may collect when you use specific features.",
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
        heading: "Device storage",
        paragraphs: [
          "Bookmarks, compare selections, predictor inputs, and rate limits for the share form may be stored in your browser. This stays on your device unless you clear site data.",
        ],
      },
      {
        heading: "Thuto Premium and billing",
        paragraphs: [
          "If you subscribe to Thuto Premium, payment is processed by Stripe. We store your subscription status in your Supabase profile.",
          "Premium may sync saved programmes and predictor snapshots to your account. Core eligibility browsing remains available without a paid plan.",
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
      body: "Download programme breakdowns, get WhatsApp support, and unlock unlimited tools to finalize your applications.",
    },
    features: {
      heading: "Pro Features",
      items: [
        { key: "alerts", icon: "alerts", text: "Deadline alerts for saved universities and programmes" },
        { key: "predictor", icon: "predictor", text: "Richer predictor history and admission guidance" },
        { key: "support", icon: "support", text: "Priority support when checking applications" },
        { key: "pdf", icon: "pdf", text: "Download & Share: Get full programme breakdowns as PDFs to send to parents and teachers" },
        { key: "whatsapp", icon: "whatsapp", text: "WhatsApp Support: Message our team directly for help with results, deadlines, and applications" },
        { key: "unlimited", icon: "spark", text: "Unlimited Tools: Unlimited AI messages, saves, and comparisons" },
      ],
    },
  },
};

export function defaultsForPage(pageKey) {
  return PAGE_CONTENT_DEFAULTS[pageKey] || {};
}
