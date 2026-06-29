/** Thuto Center policy version — bump when terms change materially. */
export const CENTER_POLICY_VERSION = "bw-v1";

export const CENTER_UPLOAD_REWARD_CREDITS = 3;
export const CENTER_UNLOCK_COST_CREDITS = 1;
export const CENTER_MAX_FILE_BYTES = 15 * 1024 * 1024;

export const CENTER_DOCUMENT_TYPES = [
  { value: "lecture_notes", label: "Lecture notes (your own)" },
  { value: "past_paper", label: "Past paper (officially released)" },
  { value: "exam_answer", label: "Exam answer guide (your own)" },
  { value: "study_summary", label: "Study summary (original)" },
  { value: "assignment_guide", label: "Assignment guide (original)" },
  { value: "other", label: "Other allowed material" },
];

export const CENTER_FACULTIES = [
  "Science",
  "Engineering & Technology",
  "Business & Accounting",
  "Humanities & Social Sciences",
  "Education",
  "Health Sciences",
  "Law",
  "Agriculture & Natural Resources",
  "Information Technology",
  "Arts & Design",
  "Other",
];

export const CENTER_REPORT_REASONS = [
  { value: "copyright", label: "Copyright infringement" },
  { value: "textbook_scan", label: "Textbook or publisher scan" },
  { value: "not_original", label: "Not the uploader's original work" },
  { value: "mislabeled", label: "Wrong course or institution" },
  { value: "spam", label: "Spam or scam" },
  { value: "unsafe", label: "Unsafe or harmful content" },
  { value: "other", label: "Other concern" },
];

export const CENTER_STATUS_LABELS = {
  pending_review: "Pending review",
  published: "Published",
  rejected: "Rejected",
  removed: "Removed",
};

export const CENTER_POLICY = {
  version: CENTER_POLICY_VERSION,
  heading: "Thuto Center — Botswana upload & access policy",
  effectiveDate: "29 June 2026",
  intro:
    "Thuto Center is a peer study library for Botswana tertiary students. Uploads are free. Downloads are unlocked with contribution credits or Thuto Pro. These rules follow Botswana law and university academic integrity expectations.",
  sections: [
    {
      heading: "Who may upload",
      paragraphs: [
        "You must be signed in to Thuto and set your profile to “I study here” at a listed Botswana tertiary institution.",
        "Upload only materials you created yourself, or past papers and memos that your institution has officially released for student use.",
      ],
    },
    {
      heading: "Allowed content",
      paragraphs: [
        "Your own lecture notes, summaries, and exam preparation guides.",
        "Official past examination papers and marking guidelines published by your faculty or examination office.",
        "Original assignment walkthroughs where sharing is permitted by your lecturer or institution policy.",
      ],
      bullets: [
        "PDF, Word, JPEG, PNG, or WebP files up to 15 MB.",
        "Clearly label the university, faculty, and course code.",
      ],
    },
    {
      heading: "Prohibited content",
      paragraphs: [
        "Do not upload textbook pages, publisher slides, or scanned copyrighted works.",
        "Do not upload leaked unreleased exam papers, paid course packs, or materials marked “not for distribution”.",
        "Do not upload personal data of staff or students, answer keys obtained improperly, or content that violates the University of Botswana, BIUST, BAC, or other institutional honour codes.",
      ],
    },
    {
      heading: "Copyright & Botswana law",
      paragraphs: [
        "Botswana’s Copyright and Neighbouring Rights Act (Cap. 68:02) protects literary and artistic works. Uploading copyrighted material without permission may infringe those rights.",
        "Thuto does not claim ownership of your uploads. You confirm you have the right to share each file and grant Thuto a limited licence to host, display metadata, and distribute the file to eligible Thuto users under this policy.",
        "Rights holders — including universities, lecturers, and publishers — may request removal at legal@thutoapp.com. We aim to review credible notices promptly.",
      ],
    },
    {
      heading: "Access model",
      paragraphs: [
        "Uploading is free for all signed-in students. After a moderator approves your upload, you receive 3 unlock credits.",
        "Each unlock credit lets you download one other student’s published document. Your own uploads are always free for you to download.",
        "Thuto Pro members get instant access to download all published Thuto Center documents without spending credits.",
        "Browsing titles, course codes, and descriptions is free. Only file downloads require credits or Pro.",
      ],
    },
    {
      heading: "Moderation & academic integrity",
      paragraphs: [
        "All uploads are reviewed before publication. Thuto may reject, remove, or disable downloads for policy violations.",
        "Repeated violations may lead to upload bans. Thuto Center is for study support — not for facilitating cheating or plagiarism.",
        "If your institution partners with Thuto, officially sanctioned materials may be highlighted separately in future releases.",
      ],
    },
    {
      heading: "Privacy",
      paragraphs: [
        "Your display name and university affiliation may appear on documents you upload. Do not include phone numbers, ID numbers, or private addresses in files.",
        "Download activity may be logged for abuse prevention. See the Thuto Privacy page for broader data practices.",
      ],
    },
  ],
  declaration:
    "I confirm this file is my original work or an officially released past paper, contains no copyrighted textbook or publisher scans, and complies with Thuto Center policy and my institution’s academic integrity rules.",
  contactEmail: "legal@thutoapp.com",
};
