/**
 * Merge Nelson Mandela University (NMU) undergraduate prospectus data into
 * public/data/universities.json and public/data/programmes.json.
 *
 * Source: Nelson Mandela University Undergraduate Programmes (extracted
 * markdown supplied in this conversation). The supplied prospectus is a 2024
 * publication covering the 2025 admission cycle; application dates and
 * fee-related information are therefore historical and should be verified
 * against the University's current website before use. For that reason this
 * script deliberately leaves applicationClose/applicationDeadline as null
 * rather than encoding a stale 2024/2025 date.
 *
 * IMPORTANT SCALE NOTE: Nelson Mandela University (like other South African
 * universities already in this dataset) uses an "Applicant Score" (AS) /
 * NSC-percentage admission system, not Botswana's BGCSE 48-point best-six
 * scale that this app's `minPoints` / `subjectRequirements` fields assume
 * (see src/lib/gradingSystems.js and the comment in src/lib/admissions.js).
 * There is no established AS->BGCSE conversion anywhere in this codebase, so
 * every NMU programme below has `minPoints: null` and
 * `subjectRequirements: {}`, with the raw AS/NSC admission text captured
 * as plain-English strings in `requirements` instead. Do not "helpfully"
 * invent a conversion when editing this file.
 *
 * No official website/apply URL is used anywhere below because no such URL
 * appears literally in the supplied source text (per this app's
 * never-guess-URLs policy).
 *
 * Usage: node scripts/merge-nmu-2026.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const uniPath = path.join(root, "public/data/universities.json");
const progPath = path.join(root, "public/data/programmes.json");

const UNIVERSITY_NAME = "Nelson Mandela University";
const UNIVERSITY_SHORT = "NMU";

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const university = {
  id: "nmu",
  name: UNIVERSITY_NAME,
  shortName: UNIVERSITY_SHORT,
  location: "Gqeberha, Eastern Cape",
  country: "za",
  description:
    "A multi-campus South African university based in Gqeberha (Port Elizabeth) with additional campuses including George, offering undergraduate and postgraduate programmes across business, education, engineering and the built environment, health sciences, humanities, law, and science.",
  website: null,
  phone: null,
  applicationOpen: null,
  applicationClose: null,
  academicYearStart: "2026-01",
  applyUrl: null,
  featured: false,
  sponsorshipTier: "standard",
  resources: [],
  studentIncentives: [],
};

/**
 * AS = "Applicant Score", the NSC-percentage-based admission metric NMU uses
 * instead of APS. Kept as raw text in `requirements`, never mapped to
 * minPoints/subjectRequirements (see scale note above).
 */
function asLine(math, techMath, mathLit) {
  const parts = [];
  if (math && math !== "--") parts.push(`Mathematics AS ${math}`);
  if (techMath && techMath !== "--") parts.push(`Technical Mathematics AS ${techMath}`);
  if (mathLit && mathLit !== "--") parts.push(`Mathematical Literacy AS ${mathLit}`);
  return parts.length ? `Applicant Score (AS): ${parts.join(" / ")}` : null;
}

function mkReq(as, extra) {
  const out = ["Minimum NSC statutory requirements for entry must be met (see AS below)."];
  const asL = asLine(...(as || []));
  if (asL) out.push(asL);
  if (extra && extra.length) out.push(...extra);
  return out;
}

const programmes = [
  // ---------------------------------------------------------------------
  // Faculty of Business & Economic Sciences
  // ---------------------------------------------------------------------
  {
    name: "Higher Certificate in Accountancy",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Higher Certificate",
    duration: "1 year",
    durationYears: 1,
    description:
      "Trains qualified bookkeepers for the private and public sectors, covering basic bookkeeping, tax and accounting services manually and in a computerised environment.",
    careers: ["Bookkeeper", "Accounting clerk"],
    requirements: mkReq(["290", "290", "305"], ["Mathematics or Technical Mathematics 35%, or Mathematical Literacy 60%."]),
  },
  {
    name: "Higher Certificate in Business Studies",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Higher Certificate",
    duration: "1 year",
    durationYears: 1,
    campus: "Gqeberha (also offered at George Campus)",
    description:
      "Equips students with knowledge and skills related to the business environment, widening access to selected diploma qualifications such as Economics, Marketing, Logistics, Management or Tourism Management.",
    careers: ["Marketing intern", "Marketing officer", "Office manager", "Entrepreneur"],
    requirements: mkReq(["290", "290", "305"], ["Mathematics or Technical Mathematics 30%, or Mathematical Literacy 50%."]),
  },
  {
    name: "Diploma in Accountancy",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Diploma",
    duration: "3 years (full-time) / 5 years (part-time)",
    durationYears: 3,
    description:
      "Equips students with career-orientated knowledge and skills for a career in accountancy as applied in commerce and industry.",
    careers: ["Accountant", "Internal auditor", "Cost accountant", "Financial and management accountant", "Tax consultant"],
    requirements: mkReq(["350", "350", "365"], ["Mathematics or Technical Mathematics 45%, or Mathematical Literacy 65%, or a Higher Certificate in Accountancy."]),
  },
  {
    name: "Diploma in Economics",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description:
      "Educates persons with an interest in Economics to pursue careers assisting economic research and economic report writing in public and private sector institutions.",
    careers: ["Economist", "Trade and labour analyst", "Transport economist", "Agriculture/mining/manufacturing economist", "Banking and insurance roles", "Economic journalist"],
    requirements: mkReq(["330", "330", "345"], ["Mathematics or Technical Mathematics 40%, or Mathematical Literacy 60%, or a Higher Certificate in Business Studies."]),
  },
  {
    name: "Diploma in Human Resource Management",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Diploma",
    duration: "3 years (full-time) / 4 years (part-time)",
    durationYears: 3,
    description:
      "Equips students for a career in human resources management, industrial relations, training management and personnel management.",
    careers: ["Human resources officer", "Industrial relations officer", "Training officer", "HR consultant", "HR administrator", "Recruitment consultant"],
    requirements: mkReq(["330", "330", "345"], ["Mathematics or Technical Mathematics 35%, or Mathematical Literacy 55%."]),
  },
  {
    name: "Diploma in Inventory and Stores Management",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description:
      "Provides students with the knowledge and skills necessary for the optimum performance of activities concerned with the flow of materials to and from manufacturing or user departments.",
    careers: ["Stores/warehouse manager", "Materials handling manager", "Distribution planner/manager", "Inventory controller", "Materials manager"],
    requirements: mkReq(["290", "290", "305"], ["Mathematics or Technical Mathematics 30%, or Mathematical Literacy 50%."]),
  },
  {
    name: "Diploma in Logistics",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Diploma",
    duration: "3 years (full-time) / 4 years (part-time)",
    durationYears: 3,
    description:
      "Provides students with the broad expertise necessary to plan, organise, implement and control logistics activities required to supply goods and services at optimum cost.",
    careers: ["Purchaser", "Logistics manager", "Buyer", "Supply chain manager", "Expediter", "Materials controller", "Production planner", "Import/export controller"],
    requirements: mkReq(["330", "330", "345"], ["Mathematics or Technical Mathematics 40%, or Mathematical Literacy 60%, or a Higher Certificate in Business Studies."]),
  },
  {
    name: "Diploma in Management",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Diploma",
    duration: "3 years (full-time) / 4 years (part-time)",
    durationYears: 3,
    campus: "Gqeberha (also offered at George Campus)",
    description:
      "Prepares students for management positions in the retail and manufacturing sectors, with a strong retail and financial management focus.",
    careers: ["Retail store management", "Retail buying", "Franchising", "Business administration", "Production and personnel management"],
    requirements: mkReq(["330", "330", "345"], ["Mathematics or Technical Mathematics 40%, or Mathematical Literacy 60%, or a Higher Certificate in Business Studies."]),
  },
  {
    name: "Diploma in Marketing",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    campus: "Gqeberha (also offered at George Campus)",
    description:
      "A solid entrance-level qualification into global marketing, covering brand building, advertising campaigns and e-commerce.",
    careers: ["Advertising", "Personal selling and sales management", "Product and brand management", "Customer relationship management", "Merchandising", "Marketing research"],
    requirements: mkReq(["330", "330", "345"], ["Mathematics or Technical Mathematics 40%, or Mathematical Literacy 60%, or a Higher Certificate in Business Studies."]),
  },
  {
    name: "Diploma in Tourism Management",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    campus: "Gqeberha (also offered at George Campus)",
    description:
      "Prepares students for an exciting career in the tourism industry, covering skills-based training and knowledge critical to the tourism sector.",
    careers: ["Transport (airlines, sea travel, car hire)", "Travel services/agencies", "Hospitality services", "Attractions and national parks"],
    requirements: mkReq(["330", "330", "345"], ["Mathematics or Technical Mathematics 40%, or Mathematical Literacy 60%, or a Higher Certificate in Business Studies."]),
  },
  {
    name: "Advanced Diploma in Economics",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Advanced Diploma",
    duration: "1 year (full-time)",
    durationYears: 1,
    description:
      "Opens a wide variety of career opportunities in the business world and financial services industry, building on a Diploma in Economics.",
    careers: ["Banker", "Business manager", "Economic analyst/consultant", "Financial analyst/manager", "Insurance broker", "Small business consultant"],
    requirements: [
      "Requires a 360-credit Diploma in Economics at NQF Exit Level 6, or an equivalent qualification, or a bachelor's degree with a pass of 50% or higher in all core Economics modules at NQF Levels 5 and 6.",
    ],
  },
  {
    name: "Advanced Diploma in Business Studies",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Advanced Diploma",
    duration: "1 year (full-time) / 2 years (part-time)",
    durationYears: 1,
    campus: "Gqeberha (some specialisations also offered at George Campus)",
    description:
      "Advanced Diploma in Business Studies with specialisation streams in Human Resource Management, Logistics Management, Management Practice, Marketing Management, Tourism Management, or Monitoring & Evaluation.",
    careers: ["Marketing manager/strategist", "Logistics/supply chain manager", "Management roles across industry sectors", "Tourism management and planning", "HR consultant"],
    requirements: [
      "Requires a relevant 360-credit Diploma in the chosen field of specialisation, or an equivalent qualification.",
    ],
  },
  {
    name: "Advanced Diploma in Business Studies (Financial Planning and Services)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Advanced Diploma",
    duration: "1 year (full-time) / 2 years (part-time)",
    durationYears: 1,
    description:
      "Prepares students academically and professionally to operate within a financial planning business environment, covering individual and corporate financial planning.",
    careers: ["Banking institutions", "Investment institutions", "Manufacturing and service-orientated businesses"],
    requirements: [
      "Requires a relevant 360-credit Diploma or equivalent, majoring in Business Management, Economics, Financial Accounting, Internal Auditing, Management Accounting, or Administrative Management (Qualification Code: 40406).",
    ],
  },
  {
    name: "Advanced Diploma in Accountancy (Professional Accounting)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Advanced Diploma",
    duration: "1 year (full-time) / 2 years (part-time)",
    durationYears: 1,
    description:
      "Equips students with the essential knowledge and specific skills required to perform level-appropriate accounting related services and act as professional accountants; prepares students for the SAIPA qualifying examination.",
    careers: ["Financial accountant", "Management accountant", "Internal auditor", "Tax consultant"],
    requirements: [
      "Requires a relevant 360-credit Diploma in Accountancy or an equivalent NQF Exit Level 6 qualification in a cognate field.",
    ],
  },
  {
    name: "Advanced Diploma in Accountancy (Internal Auditing)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Advanced Diploma",
    duration: "1 year (full-time) / 2 years (part-time)",
    durationYears: 1,
    description:
      "Equips students with the essential knowledge and specific skills to perform level-appropriate accounting related services and act as internal auditors; provides an articulation route to the Postgraduate Diploma in Internal Auditing.",
    careers: ["Financial accountant", "Management accountant", "Internal auditor", "Tax consultant"],
    requirements: [
      "Requires a relevant 360-credit Diploma in Accountancy or an equivalent NQF Exit Level 6 qualification in a cognate field.",
    ],
  },
  {
    name: "Bachelor of Commerce: General (Economics)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description: "Opens a wide variety of career opportunities in the business world and the financial services industry.",
    careers: ["Banker", "Business manager", "Financier", "Economist", "Training manager", "Financial manager", "Accountant", "Insurance broker", "Entrepreneur"],
    requirements: mkReq(["390", "--", "--"], ["Mathematics 50%."]),
  },
  {
    name: "Bachelor of Commerce: General (Accounting)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    campus: "Gqeberha (also offered full-time only at George Campus)",
    description:
      "Intended for students who do not wish to qualify as Chartered Accountants but who may wish to join other professional institutes (IIA, ICSA, ACCA, South African Institute of Tax Practitioners, SAIPA) while including accountancy subjects as majors.",
    careers: ["Accounting-related professional roles", "Internal auditor", "Tax practitioner"],
    requirements: mkReq(["390", "--", "--"], []),
  },
  {
    name: "Bachelor of Commerce: General (Business Management)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    campus: "Gqeberha (also offered at George Campus)",
    description:
      "Opens a wide variety of career options in the business world including entrepreneurship, business environments, marketing and strategic management.",
    careers: ["Banker", "Business manager", "Financier", "Economist", "Industrial psychologist", "HR manager", "Marketing manager", "Statistician", "Accountant", "Entrepreneur"],
    requirements: mkReq(["390", "--", "--"], ["Mathematics 50%."]),
  },
  {
    name: "Bachelor of Commerce (Financial Planning)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Leads to a professional qualification, Financial Services Associate (FSA), awarded by the Financial Planning Institute (FPI).",
    careers: ["Financial planner", "Financial Services Associate"],
    requirements: mkReq(["390", "--", "--"], []),
  },
  {
    name: "Bachelor of Commerce: General (Tourism)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Aimed at students who wish to specialise in Tourism, with a Tourism Work Experience module enabling practical work experience within the industry.",
    careers: ["Tour operations", "Tourism planning and consulting", "Destination marketing and planning", "Event management", "Tourism management within government"],
    requirements: mkReq(["390", "390", "405"], ["Mathematics or Technical Mathematics 50%, or Mathematical Literacy 70%."]),
  },
  {
    name: "Bachelor of Commerce (Marketing & Business Management)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Entry to the world of marketing: building brands, driving advertising campaigns and e-commerce, combined with business and financial management knowledge.",
    careers: ["Marketing management", "Market researcher", "Product/brand management", "Advertising", "Communication manager", "Customer relations manager"],
    requirements: mkReq(["390", "--", "--"], ["Mathematics 50%."]),
  },
  {
    name: "Bachelor of Commerce (Hospitality Management)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Designed to meet the growing managerial needs of the Southern African hospitality marketplace, covering economics, business management, financial accounting, and operations with a hospitality and tourism focus.",
    careers: ["Accommodation management", "Food and beverage management", "Events management", "Hospitality sector leadership"],
    requirements: mkReq(["390", "390", "405"], ["Mathematics or Technical Mathematics 50%, or Mathematical Literacy 70%."]),
  },
  {
    name: "Bachelor of Commerce: General (Statistics)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description: "Prepares students for a career in banking and other business statistical related fields.",
    careers: ["Statistician", "Financial manager", "Accountant", "Auditor", "Insurance broker", "Management consultant"],
    requirements: mkReq(["390", "--", "--"], ["Mathematics 60%."]),
  },
  {
    name: "Bachelor of Commerce (Accounting)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years (full-time) / 5 years (part-time)",
    durationYears: 3,
    campus: "Gqeberha (also offered at George Campus, full-time only)",
    description:
      "Prescribed for candidates who intend to qualify as a Chartered Accountant (CA), focusing on financial accounting, auditing, taxation, management accounting and finance; requires a Postgraduate Diploma in Accounting and a three-year training contract with SAICA thereafter.",
    careers: ["Chartered accountant", "Financial manager", "Chief financial officer", "Registered auditor", "Cost and management accountant", "Tax consultant", "Internal auditor"],
    requirements: mkReq(["410", "--", "--"], ["Mathematics 60%."]),
  },
  {
    name: "Bachelor of Commerce (Computer Science and Information Systems)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Combines Computer Science with essential business subjects such as accounting, business management and economics, with a focus on e-commerce, web technology and multimedia.",
    careers: ["Programmer", "Network specialist", "Project manager", "Internet specialist", "Web developer", "Business analyst"],
    requirements: mkReq(["390", "--", "--"], ["Mathematics 60%."]),
  },
  {
    name: "Bachelor of Commerce (Economics & Statistics)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Combines an in-depth study of economics with statistical methods, equipping students to isolate and infer causes of economic and business outcomes and make data-informed decisions.",
    careers: ["Economist", "Financial and statistical analyst", "Financial consultant"],
    requirements: mkReq(["390", "--", "--"], ["Mathematics 60%."]),
  },
  {
    name: "Bachelor of Commerce (Industrial Psychology & Human Resource Management)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Combines Industrial Psychology and Human Resource Management with subjects such as Business Management, Accounting, Economics, Law and Labour Relations.",
    careers: ["Human resource practitioner", "Personnel consultant/manager", "Training manager", "Labour relations manager", "Industrial psychologist"],
    requirements: mkReq(["390", "--", "--"], ["Mathematics 50%."]),
  },
  {
    name: "Bachelor of Commerce: Information Systems (Business Management)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Covers the application of computers to business management, finance, production, marketing, administration, distribution and auditing; a dual major in Information Systems and a choice of Computer Science or Business Management.",
    careers: ["Business/database programming", "Systems analysis", "Financial modelling", "Project management", "ERP (Enterprise Resource Planning) consulting"],
    requirements: mkReq(["390", "--", "--"], ["Mathematics 60%."]),
  },
  {
    name: "Bachelor of Commerce (Logistics & Transport Economics)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Introduces and prepares students for the ever-changing demands of Logistics, Transport and Supply Chain Management.",
    careers: ["Supply chain manager", "Logistics manager", "Resource planner", "Transport coordinator", "Warehouse manager"],
    requirements: mkReq(["390", "--", "--"], ["Mathematics 50%."]),
  },
  {
    name: "Bachelor of Commerce (Food Service Management)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Produces management professionals for the health and food service sector, well-grounded in business, financial and people management skills.",
    careers: ["Food service manager"],
    requirements: mkReq(["390", "--", "--"], ["Mathematics 50%."]),
  },
  {
    name: "Bachelor of Commerce in Accounting Science (Economics/Business Management)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "For candidates who wish to qualify as Chartered Accountants (SA) with the opportunity of an additional major in Economics or Business Management, proceeding to a Postgraduate Diploma in Accountancy and SAICA examinations.",
    careers: ["Chartered accountant with economics/business management specialisation"],
    requirements: mkReq(["410", "--", "--"], ["Mathematics 65%."]),
  },
  {
    name: "Bachelor of Commerce in Accounting Science (Law)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "For candidates who wish to qualify as Chartered Accountants (SA) with an additional major in Law; graduates can also proceed to LLB studies.",
    careers: ["Chartered accountant or registered auditor with legal specialisation"],
    requirements: mkReq(["410", "--", "--"], ["English (Home Language) 65% or English (First Additional Language) 70%.", "Mathematics 65%."]),
  },
  {
    name: "Bachelor of Commerce in Accounting Science (Computer Science & Information Systems)",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "For candidates who wish to qualify as Chartered Accountants (SA) with an additional major in Computer Science and Information Systems.",
    careers: ["Chartered accountant with IT specialisation", "Programmer", "Network specialist", "Business analyst"],
    requirements: mkReq(["410", "--", "--"], ["Mathematics 65%."]),
  },
  {
    name: "Bachelor of Arts in Human Resource Management",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Provides theoretical knowledge of human resources practice, labour relations, labour law, business and management, with hands-on practical skills in conflict management and organisational behaviour; Industrial Psychology forms the core of the programme.",
    careers: ["HR practitioner", "Personnel consultant", "Industrial psychologist", "Marketing practitioner", "Labour relations manager"],
    requirements: mkReq(["350", "350", "365"], ["Mathematics or Technical Mathematics 40%, or Mathematical Literacy 70%."]),
  },
  {
    name: "Bachelor of Arts in Development Studies",
    field: "Business",
    faculty: "Faculty of Business & Economic Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "An interdisciplinary programme providing a foundation in development and economics, covering policy, research of policy, and implementation of policy in a development context. Only offered if a minimum of 25 prospective applicants are admitted.",
    careers: ["Development consultant", "Development economist", "Development finance and banking", "Development planning officer"],
    requirements: mkReq(["350", "350", "365"], ["Mathematics or Technical Mathematics 40%, or Mathematical Literacy 70%."]),
  },

  // ---------------------------------------------------------------------
  // Faculty of Education
  // ---------------------------------------------------------------------
  {
    name: "Bachelor of Education: Foundation Phase (Grades R-3)",
    field: "Education",
    faculty: "Faculty of Education",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "Provides prospective teachers with knowledge of literacy, numeracy and life skills required to teach the Foundation Phase (Grades R-3), with strong emphasis on multilingual classroom contexts.",
    careers: ["Foundation Phase teacher (Grades R-3)"],
    requirements: mkReq(["350", "365", "365"], [
      "NSC achievement rating of at least 50% for English (Home Language or First Additional Language) AND 50% for Afrikaans or isiXhosa (Home Language or First Additional Language).",
      "Mathematics 45%, or Technical Mathematics, or Mathematical Literacy 60%.",
    ]),
  },
  {
    name: "Bachelor of Education: Intermediate Phase (Grades 4-6)",
    field: "Education",
    faculty: "Faculty of Education",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "Provides prospective teachers with the knowledge, understanding and skills to teach all Intermediate Phase subjects (Languages, Mathematics, Natural Science & Technology, Social Sciences, Life Skills, Arts & Culture, Economics and Management Sciences), including Grade 7.",
    careers: ["Intermediate Phase teacher (Grades 4-6/7)"],
    requirements: mkReq(["370", "385", "385"], [
      "NSC achievement rating of at least 50% for English (Home Language or First Additional Language) AND 50% for Afrikaans or isiXhosa (Home Language or First Additional Language).",
      "Mathematics 45%, or Technical Mathematics, or Mathematical Literacy 60%.",
    ]),
  },
  {
    name: "Bachelor of Education: Senior Phase and Further Education & Training (Commerce Stream)",
    field: "Education",
    faculty: "Faculty of Education",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "Equips students with the knowledge, skills and values to mediate learning in Senior Phase (Grades 7-9) and FET (Grades 10-12), specialising in Commerce Stream subjects: FET Accounting, Business Studies, Economics, Mathematics, Mathematical Literacy; SP EMS, Mathematics.",
    careers: ["Secondary school teacher (Commerce subjects)"],
    requirements: mkReq(["390", "--", "--"], [
      "NSC achievement rating of at least 50% for English (Home Language or First Additional Language) AND 50% for Afrikaans or isiXhosa.",
      "Mathematics 60%.",
      "For FET specialisation: Accounting 60%, Business Studies 60%, Economics 60% (as applicable to chosen subject).",
    ]),
  },
  {
    name: "Bachelor of Education: Senior Phase and Further Education & Training (Science Stream)",
    field: "Education",
    faculty: "Faculty of Education",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "Specialises in Science Stream subjects: FET Life Sciences, Physical Sciences, Mathematics or Mathematical Literacy; SP Mathematics, Natural Sciences.",
    careers: ["Secondary school teacher (Science subjects)"],
    requirements: mkReq(["390", "--", "--"], [
      "NSC achievement rating of at least 50% for English (Home Language or First Additional Language) AND 50% for Afrikaans or isiXhosa.",
      "Mathematics 60%.",
      "For FET specialisation: Physical Sciences 60%, Life Sciences 60%, Geography 55% (as applicable to chosen subject).",
    ]),
  },
  {
    name: "Bachelor of Education: Senior Phase and Further Education & Training (Humanities Stream)",
    field: "Education",
    faculty: "Faculty of Education",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "Specialises in Humanities Stream subjects: FET Afrikaans, English, isiXhosa, History, Geography; SP Afrikaans, English, isiXhosa, Social Science.",
    careers: ["Secondary school teacher (Humanities subjects)"],
    requirements: mkReq(["390", "405", "405"], [
      "NSC achievement rating of at least 50% for English (Home Language or First Additional Language) AND 50% for Afrikaans or isiXhosa.",
      "Mathematics 45% (60% if Geography is selected), or Mathematical Literacy 60%, or Technical Maths 60%.",
      "Language FET specialisation requires 55% in that language; History 55%; Geography 55%.",
    ]),
  },
  {
    name: "Advanced Diploma in Technical and Vocational Teaching",
    field: "Education",
    faculty: "Faculty of Education",
    qualification: "Advanced Diploma",
    duration: "1 year (full-time) / 2 years (part-time)",
    durationYears: 1,
    description:
      "A professional vocational teaching qualification at NQF Level 7 that develops competent TVET college lecturers, offered to graduates and diplomates already holding an appropriate qualification such as a bachelor's degree.",
    careers: ["TVET college lecturer"],
    requirements: [
      "Requires an appropriate 360-credit, NQF Level 6 undergraduate diploma or bachelor's degree with sufficient disciplinary learning in a cognate field to lecture a technical or vocational subject.",
      "On entry, students are assessed on academic literacy and conversational proficiency in an official African language.",
    ],
  },
  {
    name: "Postgraduate Certificate in Education: Further Education and Training (PGCE: FET)",
    field: "Education",
    faculty: "Faculty of Education",
    qualification: "Postgraduate Certificate",
    duration: "1 year (full-time) / 2 years (part-time)",
    durationYears: 1,
    description:
      "\"Caps\" an undergraduate degree, developing competent professional teachers able to teach two subjects at the FET phase (Grades 10-12).",
    careers: ["High school teacher"],
    requirements: [
      "Requires an approved bachelor's degree at NQF Level 7 or 8, including appropriate and sufficient disciplinary knowledge to teach at least two school subjects for the FET phase.",
      "Any method subject in the PGCE programme is only offered if a minimum of 20 students register for it.",
    ],
  },
  {
    name: "Postgraduate Certificate in Education: Senior Phase and Further Education & Training (PGCE: SP & FET)",
    field: "Education",
    faculty: "Faculty of Education",
    qualification: "Postgraduate Certificate",
    duration: "1 year (full-time) / 2 years (part-time)",
    durationYears: 1,
    description:
      "\"Caps\" an undergraduate degree, developing competent professional teachers able to teach one subject at FET level (Grades 10-12) and one subject at Senior Phase level (Grades 7-9).",
    careers: ["High school teacher"],
    requirements: [
      "Requires an approved bachelor's degree at NQF Level 7 or 8, including appropriate and sufficient disciplinary knowledge to teach at least one FET-phase subject and one GET-phase subject.",
      "Any method subject in the PGCE programme is only offered if a minimum of 20 students register for it.",
    ],
  },

  // ---------------------------------------------------------------------
  // Faculty of Engineering, the Built Environment & Technology
  // ---------------------------------------------------------------------
  {
    name: "Higher Certificate in Mechatronic Engineering",
    field: "Engineering",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Higher Certificate",
    duration: "1 year",
    durationYears: 1,
    description:
      "Provides an introduction to Mechatronics and Automation, including applied mathematics, science and engineering content, to fast-track learning and equip students to support engineering teams in the automation sector.",
    careers: ["Support roles in automated manufacturing", "Pathway to BEngTech/BEng degrees"],
    requirements: mkReq(["330", "330", "--"], ["Mathematics or Technical Mathematics 50%.", "Physical Sciences or Technical Science 50%."]),
  },
  {
    name: "Higher Certificate in Renewable Energy Engineering",
    field: "Engineering",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Higher Certificate",
    duration: "1 year",
    durationYears: 1,
    description:
      "Provides an introduction to Sustainable Energy and Renewable Energy Technologies, equipping students to support engineering teams in the renewable energy sector.",
    careers: ["Support roles in renewable energy sector", "Pathway to BEngTech/BEng degrees"],
    requirements: mkReq(["330", "330", "--"], ["Mathematics or Technical Mathematics 50%.", "Physical Sciences or Technical Science 50%."]),
  },
  {
    name: "Diploma in Operations Management",
    field: "Engineering",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Diploma",
    duration: "4 years (part-time)",
    durationYears: 4,
    description:
      "Equips working students with the knowledge, skills and abilities required to become competent operations managers, covering quality enhancement, supply chain management, productivity and cost reduction.",
    careers: ["Production planner", "Operations manager", "Supervisor/team leader", "Work study practitioner", "Quality practitioner"],
    requirements: mkReq(["310", "310", "325"], [
      "Mathematics or Technical Mathematics 40%, or Mathematical Literacy 60%.",
      "Must be in full-time employment in a related field; admission subject to departmental selection.",
    ]),
  },
  {
    name: "Advanced Diploma in Quality",
    field: "Engineering",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Advanced Diploma",
    duration: "2 years (part-time)",
    durationYears: 2,
    description:
      "Equips students with knowledge and advanced skills to determine and manage the effectiveness of quality management systems, appraise current systems and processes, and minimise identified problem areas.",
    careers: ["Quality practitioner", "Quality manager", "Supervisor/foreman"],
    requirements: [
      "Requires a 65% average for a relevant National Diploma, Diploma or Degree (or 60% average with two years relevant post-diploma/degree working experience).",
      "Mathematics I or equivalent at NQF Level 5; employment in a relevant field required for the project module.",
    ],
  },
  {
    name: "Advanced Diploma in Operations Management",
    field: "Engineering",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Advanced Diploma",
    duration: "2 years (part-time)",
    durationYears: 2,
    description:
      "Builds on the Diploma in Operations Management, providing a deeper level of knowledge, understanding and skills towards becoming a competent, efficient operations manager.",
    careers: ["Production planner", "Operations manager", "Foreman", "Work study/quality practitioner", "Operations analyst"],
    requirements: [
      "Requires a 65% average for a relevant National Diploma or Degree (or 60% average with two years relevant post-diploma/degree working experience), plus a Diploma in Operations Management or equivalent.",
      "Mathematics I or equivalent at NQF Level 5; employment in a relevant field required for the project modules.",
    ],
  },
  {
    name: "Bachelor of Engineering in Mechatronics",
    field: "Engineering",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "A multidisciplinary branch of engineering combining precision mechanical engineering, electronics and computer systems, providing a thorough grounding in mathematics, basic sciences, engineering sciences and engineering design.",
    careers: ["Mechatronic engineer (design, development, manufacture and operation of robotics and automated manufacturing systems)"],
    requirements: mkReq(["410", "--", "--"], [
      "Mathematics 60%.",
      "Physical Sciences 65%.",
      "Alternatively: Higher Certificate in Mechatronic Engineering with an academic average of 75%, minimum 75% for Mathematics and minimum 65% for Physical Sciences.",
    ]),
  },
  {
    name: "Bachelor of Engineering Technology in Electrical Engineering",
    field: "Engineering",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "The study of the behaviour of electrical, electronic, digital, and electromechanical systems, covering design, development, manufacturing, testing and maintenance of electrical infrastructure.",
    careers: ["Electrical Engineering Technologist (power generation, transmission and distribution corporations, government institutions, communication companies)"],
    requirements: mkReq(["370", "370", "--"], [
      "Mathematics or Technical Mathematics 60%.",
      "Physical Sciences or Technical Science 50%.",
      "Alternatively: Higher Certificate in Mechatronic or Renewable Energy Engineering (NMU) with an average of 60%+ and minimum 60% for Mathematics.",
    ]),
  },
  {
    name: "Bachelor of Engineering Technology in Industrial Engineering",
    field: "Engineering",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Develops concepts, designs and systems for manufacturing processes and services, working with material scientists, mechanical and electrical engineers to develop efficient processes and quality assurance protocols.",
    careers: ["Industrial Engineering Technologist (automated manufacturing and assembly plants, large-scale service industries)"],
    requirements: mkReq(["370", "370", "--"], [
      "Mathematics or Technical Mathematics 60%.",
      "Physical Sciences or Technical Science 50%.",
      "Alternatively: Higher Certificate in Mechatronic or Renewable Energy Engineering (NMU) with an average of 60%+ and minimum 60% for Mathematics.",
    ]),
  },
  {
    name: "Bachelor of Engineering Technology in Mechanical Engineering",
    field: "Engineering",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Focuses on the design, analysis, manufacturing, and maintenance of mechanical systems, covering optimisation and improvement of products and manufacturing processes.",
    careers: ["Mechanical Engineering Technologist (power/energy generation, automotive corporations, government institutions, mining, manufacturing plants)"],
    requirements: mkReq(["370", "370", "--"], [
      "Mathematics or Technical Mathematics 60%.",
      "Physical Sciences or Technical Science 50%.",
      "Alternatively: Higher Certificate in Mechatronic or Renewable Energy Engineering (NMU) with an average of 60%+ and minimum 60% for Mathematics.",
    ]),
  },
  {
    name: "Bachelor of Engineering Technology in Marine Engineering",
    field: "Engineering",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Applies engineering sciences and computer science to the development, design, operation and maintenance of ships and related watercraft, including naval architecture and marine structures.",
    careers: ["Naval Architect", "Shore-based Marine Engineer", "Engine Officer (Seafarer/Mariner), up to Chief Engineer"],
    requirements: mkReq(["370", "370", "--"], [
      "Mathematics or Technical Mathematics 60%.",
      "Physical Sciences or Technical Science 50%.",
      "Alternatively: Higher Certificate in Mechatronic or Renewable Energy Engineering (NMU) with an average of 60%+ and minimum 60% for Mathematics.",
    ]),
  },
  {
    name: "Bachelor of Engineering Technology in Civil Engineering",
    field: "Engineering",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description: "Civil Engineering focuses on the design, analysis and delivery of infrastructure, buildings and civil works.",
    careers: ["Civil Engineering Technologist"],
    requirements: mkReq(["370", "370", "--"], ["Mathematics or Technical Mathematics.", "Physical Sciences or Technical Science."]),
  },
  {
    name: "Diploma in Architectural Technology",
    field: "Design",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description:
      "Produces architectural technologists competent to design at a basic-to-intermediate level and perform the technical aspects of architectural practice, focused on construction technology, design and documentation.",
    careers: ["Architectural technologist (architectural practices, government institutions, property developers, self-employed consultant)"],
    requirements: mkReq(["330", "330", "345"], [
      "Mathematics or Technical Mathematics 45%, or Mathematical Literacy 60%.",
      "Qualifying applicants prepare a prescribed portfolio and attend an interview; some applicants attend a three-week preparation course before registration.",
    ]),
  },
  {
    name: "Advanced Diploma in Architectural Design",
    field: "Design",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Advanced Diploma",
    duration: "1 year",
    durationYears: 1,
    description:
      "On completion, students can register with the South African Council for the Architectural Profession (SACAP) as a Candidate Professional Senior Architectural Technologist; the design component runs concurrently with the BAS Design III class.",
    careers: ["Senior architectural technologist (SACAP candidacy pathway)"],
    requirements: [
      "Applicants whose marks are within 5% of the subminimum admission requirements must submit a portfolio of professional work completed in practice over two to three years for assessment.",
      "Applicants who completed a Diploma in Architectural Technology at another SACAP-accredited institution must submit their full academic record and portfolio for assessment.",
    ],
  },
  {
    name: "Advanced Diploma in Architectural Technology",
    field: "Design",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Advanced Diploma",
    duration: "1 year",
    durationYears: 1,
    description:
      "Produces senior architectural technologists competent to design at an intermediate level and, using advanced electronic tools, perform and control the technical aspects of architectural practice, with emphasis on \"green design\".",
    careers: ["Senior architectural technologist (SACAP candidacy pathway; architects' offices, public sector, property developers, independent practice)"],
    requirements: [
      "Requires a Diploma in Architectural Technology from Nelson Mandela University with an average of 65% for Principles of Architectural Design III (final mark) and 65% average for Studio Work I-III, and 60% for Construction and Detailing I-III.",
      "Applicants from other SACAP-accredited institutions must submit their full academic record and portfolio for assessment.",
    ],
  },
  {
    name: "Diploma in Interior Design",
    field: "Design",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description:
      "Produces interior designers competent to design working spaces and living environments, with focus on the re-use of existing buildings and installations, particularly in the commercial field.",
    careers: ["Interior designer (interior design firms, architectural practices, furniture manufacturers, property developers, self-employed consultant)"],
    requirements: mkReq(["315", "315", "330"], [
      "Mathematics or Technical Mathematics 30%, or Mathematical Literacy 45%.",
      "Admission subject to departmental selection based on a creative portfolio submission and interview.",
      "Recommended NSC/IEB subjects: Visual Arts, Design (neither is a prerequisite).",
    ]),
  },
  {
    name: "Advanced Diploma in Interior Design",
    field: "Design",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Advanced Diploma",
    duration: "1 year",
    durationYears: 1,
    description:
      "Prepares senior interior designers for larger projects, aiming to produce designers who can, with experience, practice independently as part of a team of consultants responsible for major new and adaptive re-use projects.",
    careers: ["Senior interior designer (interior design firms, architectural practices, furniture manufacturers, property developers, self-employed consultant)"],
    requirements: [
      "Requires a Diploma in Interior Design from Nelson Mandela University with a final mark of at least 65% for Interior Design III, Design Technology III, and Contemporary Developments III (lowest mark 60%).",
      "Applicants from other institutions submit their full academic record and portfolio for assessment.",
    ],
  },
  {
    name: "Higher Certificate in Human Settlement",
    field: "Design",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Higher Certificate",
    duration: "1 year",
    durationYears: 1,
    description: "Introduces students to Human Settlement development and management.",
    careers: ["Human settlement management support roles"],
    requirements: mkReq(["--", "--", "--"], ["Minimum statutory NSC requirements for higher certificate entry must be met."]),
  },
  {
    name: "Diploma in Building",
    field: "Design",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description:
      "The Building and Construction Industry is a dynamic industry; this programme prepares diplomates for supervisory and management roles in building.",
    careers: ["Building industry supervisory and management roles"],
    requirements: mkReq(["330", "330", "--"], ["Minimum statutory NSC requirements for diploma entry must be met."]),
  },
  {
    name: "Advanced Diploma in Quantity Surveying",
    field: "Design",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Advanced Diploma",
    duration: "1 year",
    durationYears: 1,
    description: "Provides students with more advanced quantity surveying knowledge and skills, building on a Diploma in Building or equivalent.",
    careers: ["Quantity surveying roles"],
    requirements: [
      "Requires a Diploma: Building (360 NQF credits) or an equivalent qualification.",
    ],
  },
  {
    name: "Bachelor of Science in Construction Economics",
    field: "Design",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description: "Introduces students to various construction economics disciplines, preparing them for financial and cost-management roles in the built environment.",
    careers: ["Quantity surveyor (financial roles in construction)"],
    requirements: mkReq(["370", "--", "--"], ["Minimum statutory NSC requirements for degree entry must be met."]),
  },
  {
    name: "Bachelor of Science in Construction Studies",
    field: "Design",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description: "Enables graduates to perform technical, managerial and supervisory functions in the construction industry.",
    careers: ["Construction industry employment (technical/managerial roles)"],
    requirements: mkReq(["370", "--", "--"], ["Minimum statutory NSC requirements for degree entry must be met."]),
  },
  {
    name: "Bachelor of Human Settlement Development",
    field: "Design",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Bachelor's degree",
    duration: null,
    durationYears: null,
    description: "A degree in the Human Settlement Development field; duration and admission grid were not fully captured in the supplied prospectus extract.",
    careers: ["Human settlement development roles"],
    requirements: ["Minimum statutory NSC requirements for degree entry must be met (details not fully captured in the supplied extract; verify with the University)."],
  },
  {
    name: "Higher Certificate: IT (User Support)",
    field: "Technology",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Higher Certificate",
    duration: "1 year",
    durationYears: 1,
    description: "Enables students to work as an IT technician, responsible for troubleshooting and user support.",
    careers: ["IT technician"],
    requirements: mkReq(["290", "290", "305"], ["Minimum statutory NSC requirements for higher certificate entry must be met."]),
  },
  {
    name: "Diploma in Information Technology (Software Development)",
    field: "Technology",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description: "Prepares students to write and maintain software as Software Developers.",
    careers: ["Software developer"],
    requirements: mkReq(["330", "330", "345"], ["Minimum statutory NSC requirements for diploma entry must be met."]),
  },
  {
    name: "Bachelor of Information Technology",
    field: "Technology",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description: "Develops IT professionals who are in high demand, covering the breadth of information technology practice.",
    careers: ["IT professional"],
    requirements: mkReq(["370", "370", "--"], ["Minimum statutory NSC requirements for degree entry must be met."]),
  },
  {
    name: "Advanced Diploma in Information Technology",
    field: "Technology",
    faculty: "Faculty of Engineering, the Built Environment & Technology",
    qualification: "Advanced Diploma",
    duration: "1 year",
    durationYears: 1,
    description: "Builds on prior study of Information Technology at diploma level, opening various career opportunities depending on specialisation.",
    careers: ["Various IT career opportunities depending on specialisation"],
    requirements: ["Requires a minimum NQF Level 6 qualification in Information Technology or a cognate field."],
  },

  // ---------------------------------------------------------------------
  // Faculty of Health Sciences
  // ---------------------------------------------------------------------
  {
    name: "Bachelor of Environmental Health",
    field: "Health Sciences",
    faculty: "Faculty of Health Sciences",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "Environmental Health Practitioners apply their skills to identify, assess and manage risks to human health across air quality, water quality, food and meat hygiene, occupational health and safety, and environmental sustainability.",
    careers: ["Environmental Health Practitioner (public sector: national/provincial/local government)", "SHEQ and HACCP specialist (private sector)"],
    requirements: mkReq(["390", "--", "--"], [
      "Mathematics 50%.",
      "Life Sciences 50%.",
      "Physical Sciences 50%.",
      "Admission is subject to departmental selection.",
    ]),
  },
  {
    name: "Bachelor of Arts in Psychology",
    field: "Social Sciences",
    faculty: "Faculty of Health Sciences",
    qualification: "Bachelor's degree",
    duration: null,
    durationYears: null,
    description:
      "Core modules cover health psychology, gender and social psychology, traumatology, cross-cultural psychology, neuropsychology, research methodology, relationship psychology, psychopathology, psychological assessment and intervention, and career psychology. Admission grid was not fully captured in the supplied prospectus extract.",
    careers: ["Psychology-related roles (further registration/postgraduate study typically required for clinical practice)"],
    requirements: ["Admission requirements not fully captured in the supplied extract; verify current AS/NSC requirements with the University."],
  },
  {
    name: "Diploma in Sport Management",
    field: "Health Sciences",
    faculty: "Faculty of Health Sciences",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description:
      "Equips students with the knowledge, attitudes and skills essential for a successful career in sport management, including involvement in a specialist sport club.",
    careers: ["Sport administrator", "Sport marketer", "Sport agent", "Sport manager", "Sport development officer", "Sport commentator"],
    requirements: mkReq(["330", "345", "345"], [
      "Mathematics 40%, or Technical Mathematics, or Mathematical Literacy 60%.",
      "Active participation in competitive sport as approved by the department; preference given to students who have excelled in sport.",
    ]),
  },
  {
    name: "Bachelor of Human Movement Science",
    field: "Health Sciences",
    faculty: "Faculty of Health Sciences",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Allows students to specialise in one of four areas: Exercise Science, Recreation, Sport Management, or Coaching Science, complemented by additional subjects such as business management or psychology.",
    careers: ["Teaching (school and professional sport coaching)", "Exercise and fitness instruction", "Sport management and recreation", "Personal trainer/gym manager"],
    requirements: mkReq(["350", "365", "365"], [
      "Mathematics 45%, or Technical Mathematics, or Mathematical Literacy 65%.",
      "Candidates must pass a medical examination as required by the Department of Human Movement Science.",
    ]),
  },
  {
    name: "Bachelor of Health Science in Biokinetics",
    field: "Health Sciences",
    faculty: "Faculty of Health Sciences",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "Trains professionals who contribute to health, well-being and quality of life through holistic return-to-play criteria for athletes and preventive health care via scientifically based physical activity programmes.",
    careers: ["Biokineticist (private and public clinical practice)", "School wellness programmes", "Government/corporate wellness roles"],
    requirements: mkReq(["370", "385", "385"], [
      "Mathematics 50%, or Technical Mathematics, or Mathematical Literacy 65%.",
      "Life Sciences 50%.",
      "Satisfactory medical report required.",
    ]),
  },
  {
    name: "Bachelor of Nursing",
    field: "Health Sciences",
    faculty: "Faculty of Health Sciences",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "Prepares highly skilled, independent professional nurses to provide comprehensive nursing care to individuals, groups and communities across a variety of health-care settings, combining campus lectures with clinical practicals.",
    careers: ["Professional nurse (private/public hospitals, comprehensive health care clinics, private practice)"],
    requirements: mkReq(["370", "385", "385"], [
      "Mathematics 50%, or Technical Mathematics, or Mathematical Literacy 65%.",
      "Life Sciences 60%.",
      "Physical Sciences 50%.",
      "Students must be registered as student nurses with the South African Nursing Council and submit a satisfactory medical report; annual proof of professional indemnity insurance is required.",
    ]),
  },
  {
    name: "Bachelor of Radiography in Diagnostic",
    field: "Health Sciences",
    faculty: "Faculty of Health Sciences",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "Prepares students for the professional field of diagnostic radiography, entailing the production of x-ray images of the human body to diagnose disease; graduates undertake one year of community service as required by law.",
    careers: ["Diagnostic radiographer"],
    requirements: mkReq(["390", "--", "--"], [
      "Mathematics 50%.",
      "Life Sciences 50%.",
      "Physical Sciences 50%.",
      "Applicants must be physically fit; closing date for all new applicants is 30 June; admission subject to departmental selection.",
    ]),
  },
  {
    name: "Bachelor of Emergency Medical Care",
    field: "Health Sciences",
    faculty: "Faculty of Health Sciences",
    qualification: "Bachelor's degree",
    duration: null,
    durationYears: null,
    description:
      "Aims to meet the needs of South Africa by producing well-balanced practitioners with a thorough understanding of rescue principles and advanced patient care in diverse and adverse conditions required for emergency medical care and rescue professions. Admission grid was not fully captured in the supplied prospectus extract.",
    careers: ["Emergency medical care and rescue professional"],
    requirements: ["Admission requirements not fully captured in the supplied extract; verify current AS/NSC requirements with the University."],
  },
  {
    name: "Bachelor of Medicine and Bachelor of Surgery (MBChB)",
    field: "Health Sciences",
    faculty: "Faculty of Health Sciences",
    qualification: "Bachelor's degree",
    duration: null,
    durationYears: null,
    description:
      "Trains students to provide preventive, promotive, therapeutic and rehabilitative health services, developing medical doctors able and willing to serve and improve health in urban, peri-urban and rural areas of the Eastern Cape and South Africa. Followed by a two-year internship and one year of community service before registering as a doctor.",
    careers: ["Medical doctor (general practitioner in hospitals or private practice)", "Research/teaching (with postgraduate specialisation)"],
    requirements: [
      "Places are limited; admission is subject to the Medical Selection Committee's processes and does not guarantee a place.",
      "Closing date for all MBChB applications is 30 June.",
      "Students must register with the Health Professions Council of South Africa (HPCSA) as medical students; annual proof of professional indemnity insurance required.",
    ],
  },

  // ---------------------------------------------------------------------
  // Faculty of Humanities
  // ---------------------------------------------------------------------
  {
    name: "Bachelor of Visual Art",
    field: "Creative Arts",
    faculty: "Faculty of Humanities",
    qualification: "Bachelor's degree",
    duration: "1 year generic + 2 years specialisation (3 years total)",
    durationYears: 3,
    description:
      "Begins with a generic first year of study providing a broad base of visual literacy, creative problem solving and design skills; on successful completion, students apply for selection into either the Fine Art or Design stream.",
    careers: ["See relevant discipline field below (Fashion & Textiles, Graphic Design, Photography, Fine Art)"],
    requirements: mkReq(["350", "365", "365"], [
      "Qualifying applicants prepare a prescribed portfolio and attend an interview; the portfolio is the leading indicator and numbers are limited.",
      "Recommended NSC/IEB subjects: Visual Arts, Design (neither is a prerequisite).",
    ]),
  },
  {
    name: "Bachelor of Visual Art (Fashion and Textiles)",
    field: "Creative Arts",
    faculty: "Faculty of Humanities",
    qualification: "Bachelor's degree",
    duration: "2 years (after generic first year)",
    durationYears: 2,
    description:
      "Equips students to function within the fashion and textile industry, adapting to fast-changing needs of clothing and fashion, with individual design and product development as a major focus.",
    careers: ["Clothing designer", "Pattern maker", "Theatre/fashion designer", "Fashion illustrator", "Fashion marketer/entrepreneur", "Textile designer", "Stylist"],
    requirements: ["Only students who successfully complete the generic first-year BVA programme are considered; requires an interview and interview portfolio."],
  },
  {
    name: "Bachelor of Visual Art (Graphic Design)",
    field: "Creative Arts",
    faculty: "Faculty of Humanities",
    qualification: "Bachelor's degree",
    duration: "2 years (after generic first year)",
    durationYears: 2,
    description:
      "Enables students to develop creative approaches to solving graphic communication problems, with training to establish their own business or find employment as designers.",
    careers: ["Graphic designer (advertising agencies, design studios, packaging, web development, illustration/animation houses)"],
    requirements: ["Only students who successfully complete the generic first-year BVA programme are considered; requires an interview and interview portfolio."],
  },
  {
    name: "Bachelor of Visual Art (Photography)",
    field: "Creative Arts",
    faculty: "Faculty of Humanities",
    qualification: "Bachelor's degree",
    duration: "2 years (after generic first year)",
    durationYears: 2,
    description: "Equips students with comprehensive knowledge of photographic and imaging processes, materials and apparatus through hands-on field, studio and professional assignment experience.",
    careers: ["Commercial/fashion/advertising photographer", "Photo finishing industries", "Publishing and journalism", "Film and video production", "Digital imaging"],
    requirements: ["Only students who successfully complete the generic first-year BVA programme are considered; requires an interview and interview portfolio."],
  },
  {
    name: "Bachelor of Visual Art (Fine Art)",
    field: "Creative Arts",
    faculty: "Faculty of Humanities",
    qualification: "Bachelor's degree",
    duration: "2 years (after generic first year)",
    durationYears: 2,
    description:
      "Offers training in Sculpture, Painting, Printmaking, Drawing (visualisation techniques) and Ceramics, with an accent on research, creative practice problem solving and process skills for contemporary art production.",
    careers: ["Professional artist", "Animator", "Illustrator", "Model-maker (theatre, television, film)", "Curator", "Museum/gallery sector", "Teacher/lecturer"],
    requirements: ["Only students who successfully complete the generic first-year BVA programme are considered; requires an interview and interview portfolio."],
  },
  {
    name: "Diploma in Music (Curriculum 1)",
    field: "Creative Arts",
    faculty: "Faculty of Humanities",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description:
      "Focused on the adult beginner, offering bridging courses in practical music, music theory and English language skills, with specialisation in either western art music or jazz; no prior formal music training required.",
    careers: ["Private music teaching", "Music technology", "Choral conducting"],
    requirements: mkReq(["290", "305", "305"], [
      "No prior formal music training required for theoretical subjects or instrumental studies.",
      "Admission subject to departmental selection based on an audition in the candidate's chosen First Instrument.",
    ]),
  },
  {
    name: "Diploma in Music (Curriculum 2)",
    field: "Creative Arts",
    faculty: "Faculty of Humanities",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description:
      "Designed for students with prior learning in music who do not yet qualify for entry to BMus degree studies; on completion they may vertically articulate to the BMus, retaining up to 240 credits.",
    careers: ["Performer", "Composer", "Programme compiler", "Music journalist", "Arts administrator", "Music librarian/archivist"],
    requirements: mkReq(["290", "305", "305"], [
      "Admission subject to an audition in the candidate's chosen First Instrument.",
      "A minimum musical performance standard equivalent to Grade 2 (Unisa/ABRSM/Trinity Guildhall) is required for admission to First Instrument: Intermediate.",
    ]),
  },
  {
    name: "Bachelor of Music (School Music)",
    field: "Creative Arts",
    faculty: "Faculty of Humanities",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "Develops students' ability to critically engage with theories of music education and apply effective teaching and learning strategies in the music classroom.",
    careers: ["Music teacher"],
    requirements: mkReq(["350", "365", "365"], [
      "A minimum practical music standard equivalent to Grade 6 (external examining bodies) required for admission to First Instrument: Advanced.",
      "A minimum standard in music theory equivalent to Grade 5 required.",
      "Admission subject to an audition in the applicant's chosen First Instrument and a music theory entrance test.",
    ]),
  },
  {
    name: "Bachelor of Music (Performing Arts)",
    field: "Creative Arts",
    faculty: "Faculty of Humanities",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "Equips students with the ability to work as performing artists in a creative environment and to critically engage with conventions of performance practice.",
    careers: ["Performing musician (solo or ensemble)"],
    requirements: mkReq(["350", "365", "365"], [
      "A minimum practical music standard equivalent to Grade 6 required for admission to First Instrument: Advanced.",
      "A minimum standard in music theory equivalent to Grade 5 required.",
      "Admission subject to an audition and a music theory entrance test.",
    ]),
  },
  {
    name: "Bachelor of Music (Music Technology)",
    field: "Creative Arts",
    faculty: "Faculty of Humanities",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "Broadly engages the intersection of Art and Science in Music, equipping students to exploit the tools of digital audio, including the modern digital recording studio, in support of music production, performance, research and pedagogy.",
    careers: ["Music technologist", "Producer", "Arranger/composer", "Sound engineer", "Independent record label owner", "Acoustics/sound installation consultant"],
    requirements: mkReq(["350", "365", "365"], [
      "A minimum practical music standard equivalent to Grade 6 required for admission to First Instrument: Advanced.",
      "A minimum standard in music theory equivalent to Grade 5 required.",
      "Admission subject to an audition and a music theory entrance test.",
    ]),
  },
  {
    name: "Bachelor of Music (General)",
    field: "Creative Arts",
    faculty: "Faculty of Humanities",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description:
      "Provides students the opportunity to cover a diverse range of musical skills and knowledge literacies rather than a focused specialisation, ideally suited to the versatile musician; allows selection of non-music elective courses.",
    careers: ["Versatile musician (broad-based career options across performance, education and administration)"],
    requirements: mkReq(["350", "365", "365"], [
      "A minimum practical music standard equivalent to Grade 6 required for admission to First Instrument: Advanced.",
      "Admission subject to an audition and a music theory entrance test.",
    ]),
  },
  {
    name: "Bachelor of Arts",
    field: "Humanities",
    faculty: "Faculty of Humanities",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "A highly flexible programme where students choose two majors from disciplines including Anthropology, Afrikaans, Business Management, Economics, English, History, French, Geography, Industrial Psychology, isiXhosa, Philosophy, Political Studies, Psychology, Public Administration, and Sociology; students majoring in teaching subjects can follow with a PGCE.",
    careers: ["Flexible career paths across humanities and social sciences fields", "High school teaching (with PGCE)"],
    requirements: mkReq(["350", "365", "365"], [
      "60% pass in any NSC (Home or First Additional Language).",
      "Mathematics 35%, or Technical Mathematics, or Mathematical Literacy 55%.",
    ]),
  },
  {
    name: "Bachelor of Arts in Media, Communication & Culture",
    field: "Humanities",
    faculty: "Faculty of Humanities",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Provides theoretical knowledge and practical skills in communications, arts and culture, language and literature, media and information technology, covering cultural studies, advertising, film studies and newspaper/magazine writing.",
    careers: ["Journalism and mass media", "Video production", "Public relations", "Design", "Advertising", "Corporate communications"],
    requirements: mkReq(["350", "365", "365"], [
      "60% pass in any NSC (Home or First Additional Language).",
      "Mathematics 35%, or Technical Mathematics, or Mathematical Literacy 55%.",
    ]),
  },
  {
    name: "Diploma in Public Relations Management",
    field: "Business",
    faculty: "Faculty of Humanities",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description: "Equips candidates with the knowledge and skills required for a career in public relations.",
    careers: ["Public relations practitioner"],
    requirements: mkReq(["330", "345", "345"], ["Minimum statutory NSC requirements for diploma entry must be met."]),
  },
  {
    name: "Advanced Diploma in Public Relations Management",
    field: "Business",
    faculty: "Faculty of Humanities",
    qualification: "Advanced Diploma",
    duration: "1 year",
    durationYears: 1,
    description: "Builds on the Diploma in Public Relations Management, preparing graduates for mid-level management positions.",
    careers: ["Mid-level management in corporate PR"],
    requirements: ["Requires a Diploma in Public Relations Management or an equivalent qualification."],
  },
  {
    name: "Diploma in Public Management",
    field: "Social Sciences",
    faculty: "Faculty of Humanities",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description:
      "Trains students for a career in the public sector, equipping them with administrative and management skills relevant for a career in the private and public sectors.",
    careers: ["General/financial/personnel manager in central, provincial or local government", "Related public and parastatal institutions", "Private sector"],
    requirements: mkReq(["310", "325", "325"], ["Mathematics 35%, or Technical Mathematics, or Mathematical Literacy 55%."]),
  },
  {
    name: "Advanced Diploma in Public Administration and Management",
    field: "Social Sciences",
    faculty: "Faculty of Humanities",
    qualification: "Advanced Diploma",
    duration: "1 year",
    durationYears: 1,
    description:
      "Develops graduates with theoretical insights, operational skills and critical insight into the socio-economic and socio-political realm that defines the public service.",
    careers: ["General/financial/personnel manager in government", "Related public and parastatal institutions", "Private sector"],
    requirements: ["Requires a Diploma in Public Management or an equivalent qualification with an overall academic average of at least 60%."],
  },
  {
    name: "Bachelor of Arts in Politics and Economics",
    field: "Social Sciences",
    faculty: "Faculty of Humanities",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Provides graduates with an intensive understanding of political issues and theories, economics and economic policies, covering governance, democratisation, political philosophy, Global South studies, International Relations, conflict and peace studies, and micro/macroeconomics.",
    careers: ["Government roles", "Private sector", "Research and academia", "Journalism", "International Organisations, INGOs and NPOs"],
    requirements: mkReq(["350", "365", "365"], [
      "60% pass in any NSC (Home or First Additional Language).",
      "Mathematics 40%, or Technical Mathematics, or Mathematical Literacy 70%.",
    ]),
  },
  {
    name: "Bachelor of Administration (Public Administration)",
    field: "Social Sciences",
    faculty: "Faculty of Humanities",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description: "A degree preparing students for public administration careers, with outcomes depending on chosen specialisation.",
    careers: ["Public administration roles (depending on specialisation)"],
    requirements: mkReq(["350", "365", "365"], ["Minimum statutory NSC requirements for degree entry must be met."]),
  },

  // ---------------------------------------------------------------------
  // Faculty of Law
  // ---------------------------------------------------------------------
  {
    name: "Higher Certificate in Law Enforcement",
    field: "Law",
    faculty: "Faculty of Law",
    qualification: "Higher Certificate",
    duration: "1 year",
    durationYears: 1,
    description:
      "Provides a vocational, industry-focused qualification equipping students with the tools, knowledge and practical techniques required to perform law enforcement functions under the Criminal Procedure Act and related legislation. Does not provide direct access into the LLB, LLB (extended), BCom (Law) or BA (Law).",
    careers: ["Law enforcement officer (municipalities, Forestry, Fisheries, SANParks, SAPS, metro police, correctional services)"],
    requirements: mkReq(["310", "325", "325"], ["English (Home Language) 50%, or English (First Additional Language) 55%."]),
  },
  {
    name: "Diploma in Law Enforcement",
    field: "Law",
    faculty: "Faculty of Law",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description:
      "Focused on law enforcement in the marine and coastal environment, covering criminal procedure and evidence, criminal investigation, crime scene management and conducting a criminal trial. Does not provide direct access into the LLB, LLB (extended), BCom (Law) or BA (Law).",
    careers: ["Municipal law enforcement", "Building control", "Forestry/fisheries/SANParks enforcement", "Rail and road transport enforcement"],
    requirements: mkReq(["330", "345", "345"], [
      "English (Home Language) 55%, or English (First Additional Language) 60%.",
      "Alternatively: an average mark of at least 60% for the Higher Certificate in Law Enforcement.",
    ]),
  },
  {
    name: "Bachelor of Arts in Law",
    field: "Law",
    faculty: "Faculty of Law",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Enables students to combine a major in Humanities (such as political science, economics, psychology, French or communication studies) with a major in Law, as preparation for a two-year LLB thereafter.",
    careers: ["Pathway to LLB and the legal profession", "Public prosecutor/public defender (civil service)", "Legal adviser"],
    requirements: mkReq(["390", "405", "405"], [
      "English (Home Language) 65%, or English (First Additional Language) 70%.",
      "Mathematics 50%, or Technical Mathematics, or Mathematical Literacy 75%.",
    ]),
  },
  {
    name: "Bachelor of Commerce in Law",
    field: "Law",
    faculty: "Faculty of Law",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description: "Tailor-made for students seeking a corporate/commercial legal grounding combined with commerce subjects.",
    careers: ["Corporate legal advisor", "Civil service legal roles"],
    requirements: mkReq(["390", "--", "--"], ["Minimum statutory NSC requirements for degree entry must be met."]),
  },
  {
    name: "Bachelor of Laws (LLB)",
    field: "Law",
    faculty: "Faculty of Law",
    qualification: "Bachelor's degree",
    duration: "4 years",
    durationYears: 4,
    description: "The four-year undergraduate LLB, offering entry to all branches of the legal profession; the Faculty is also home to the Eastern Cape Street Law project.",
    careers: ["Attorney", "Advocate", "Legal advisor", "Prosecutor"],
    requirements: mkReq(["390", "--", "--"], ["Minimum statutory NSC requirements for degree entry must be met."]),
  },
  {
    name: "Bachelor of Laws (LLB) Extended Curriculum",
    field: "Law",
    faculty: "Faculty of Law",
    qualification: "Bachelor's degree",
    duration: "5 years",
    durationYears: 5,
    description:
      "The extended curriculum programme for LLB studies provides alternative university access to students who have the potential to succeed but do not meet the minimum admission requirements for the mainstream programme.",
    careers: ["Attorney", "Advocate", "Legal advisor", "Prosecutor"],
    requirements: mkReq(["370", "385", "385"], ["Minimum statutory NSC requirements for degree entry must be met."]),
  },

  // ---------------------------------------------------------------------
  // Faculty of Science (including George Campus forestry/nature conservation offerings)
  // ---------------------------------------------------------------------
  {
    name: "Diploma in Agricultural Management",
    field: "Agriculture",
    faculty: "Faculty of Science",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description: "Teaches the problem-solving and management skills needed for a career in agricultural management, including practical training components.",
    careers: ["Agricultural management roles"],
    requirements: mkReq(["330", "330", "345"], ["Minimum statutory NSC requirements for diploma entry must be met."]),
  },
  {
    name: "Diploma in Analytical Chemistry",
    field: "Natural Sciences",
    faculty: "Faculty of Science",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description: "Consists of full-time study including practical training in analytical chemistry techniques.",
    careers: ["Analytical chemist"],
    requirements: mkReq(["350", "--", "--"], ["Minimum statutory NSC requirements for diploma entry must be met."]),
  },
  {
    name: "Diploma in Game Ranch Management",
    field: "Agriculture",
    faculty: "Faculty of Science",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description: "Includes thorough training for careers on private game ranches, including compulsory tours and excursions.",
    careers: ["Game rancher (private game ranches)"],
    requirements: mkReq(["330", "330", "345"], ["Minimum statutory NSC requirements for diploma entry must be met."]),
  },
  {
    name: "Diploma in Polymer Technology",
    field: "Technology",
    faculty: "Faculty of Science",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description: "Covers polymer technology, preparing students for employment opportunities including in the motor industry.",
    careers: ["Polymer/plastics technology roles (including motor industry)"],
    requirements: mkReq(["350", "--", "--"], ["Minimum statutory NSC requirements for diploma entry must be met."]),
  },
  {
    name: "Diploma in Chemical Process Technology",
    field: "Technology",
    faculty: "Faculty of Science",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    description: "Currently the only one of its kind, comprising a mixture of disciplinary-based chemical process content.",
    careers: ["Chemical process technician"],
    requirements: mkReq(["350", "--", "--"], ["Minimum statutory NSC requirements for diploma entry must be met."]),
  },
  {
    name: "Advanced Diploma in Analytical Chemistry",
    field: "Natural Sciences",
    faculty: "Faculty of Science",
    qualification: "Advanced Diploma",
    duration: "1 year",
    durationYears: 1,
    description: "Equips students with training in more advanced analytical chemistry, building on a Diploma in Analytical Chemistry or a BSc with chemistry as a major.",
    careers: ["Advanced analytical chemistry roles"],
    requirements: ["Requires a Diploma in Analytical Chemistry, or a BSc degree with chemistry as a major, or an equivalent qualification."],
  },
  {
    name: "Advanced Diploma in Agricultural Management",
    field: "Agriculture",
    faculty: "Faculty of Science",
    qualification: "Advanced Diploma",
    duration: "1 year",
    durationYears: 1,
    description: "Equips students with in-depth knowledge and skills building on a 360-credit Diploma in Agricultural Management.",
    careers: ["Advanced agricultural management roles"],
    requirements: ["Requires a 360-credit Diploma in Agricultural Management or an equivalent qualification."],
  },
  {
    name: "Bachelor of Science in Biological Sciences",
    field: "Natural Sciences",
    faculty: "Faculty of Science",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description: "BSc with majors in Botany and Zoology.",
    careers: ["Marine biology", "Conservation biology", "Ecology", "Environmental management", "Coastal zone management"],
    requirements: mkReq(["410", "--", "--"], ["Mathematics 60%."]),
  },
  {
    name: "Bachelor of Science (Biochemistry, Chemistry, Microbiology & Physiology)",
    field: "Natural Sciences",
    faculty: "Faculty of Science",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description: "BSc with two majors chosen from Biochemistry, Chemistry, Microbiology & Physiology.",
    careers: ["Chemical/food/biotechnological industry", "Teaching", "Medical/agriculture/chemistry/sport/nutrition research"],
    requirements: mkReq(["410", "--", "--"], ["Mathematics 60%."]),
  },
  {
    name: "Bachelor of Science (Environmental Sciences)",
    field: "Natural Sciences",
    faculty: "Faculty of Science",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description: "BSc with two majors chosen from Geography, Geology, Botany, Zoology or Chemistry.",
    careers: ["Mining", "Water affairs", "Environmental affairs", "Consulting and civil engineering"],
    requirements: mkReq(["410", "--", "--"], ["Mathematics 60%."]),
  },
  {
    name: "Bachelor of Science: Geosciences (Geology & Geography)",
    field: "Natural Sciences",
    faculty: "Faculty of Science",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description: "BSc with majors in Geography and Geology.",
    careers: ["Geographer", "Geologist", "Mining and exploration", "Water affairs", "Environmental/geo-technical consulting"],
    requirements: mkReq(["410", "--", "--"], ["Mathematics 60%."]),
  },
  {
    name: "Bachelor of Science (Computer Science)",
    field: "Natural Sciences",
    faculty: "Faculty of Science",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "BSc with majors in Applied Mathematics, Mathematics, Mathematical Statistics, Physics and Computer Fundamentals (with variant combinations including Computer Science, Mathematics and Statistics for a Data Science focus).",
    careers: ["Business/banking/government/military careers", "Data Science (Business Intelligence Analyst, Data Mining Engineer, Data Architect, Data Scientist)"],
    requirements: mkReq(["410", "--", "--"], ["Mathematics 65%."]),
  },
  {
    name: "Bachelor of Science (Physical Science & Mathematics)",
    field: "Natural Sciences",
    faculty: "Faculty of Science",
    qualification: "Bachelor's degree",
    duration: "3 years",
    durationYears: 3,
    description:
      "Based on the three cornerstone subjects of Mathematics, Physics and Chemistry, providing an excellent basis for postgraduate studies and for those wishing to teach physical science and/or mathematics up to senior secondary level.",
    careers: ["Researcher", "Scientist", "Chemist", "Mathematician", "Physicist", "Physical Science and/or Mathematics teacher"],
    requirements: mkReq(["410", "--", "--"], ["Mathematics 65%."]),
  },
  {
    name: "Diploma in Forestry",
    field: "Agriculture",
    faculty: "Faculty of Science (George Campus)",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    campus: "George Campus",
    description: "Consists of two years of applied theoretical and practical forestry training.",
    careers: ["Forestry sector (private and government employers)"],
    requirements: mkReq(["330", "330", "345"], ["Minimum statutory NSC requirements for diploma entry must be met."]),
  },
  {
    name: "Diploma in Nature Conservation",
    field: "Agriculture",
    faculty: "Faculty of Science (George Campus)",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    campus: "George Campus",
    description: "Consists of two years of applied theoretical and practical training in nature conservation.",
    careers: ["Nature conservator", "Game ranch management"],
    requirements: mkReq(["330", "330", "345"], ["Minimum statutory NSC requirements for diploma entry must be met."]),
  },
  {
    name: "Diploma in Wood Technology",
    field: "Agriculture",
    faculty: "Faculty of Science (George Campus)",
    qualification: "Diploma",
    duration: "3 years",
    durationYears: 3,
    campus: "George Campus",
    description: "Consists of two years of theoretical and practical training in wood technology, with graduates mainly employed by the softwood and hardwood industries.",
    careers: ["Softwood and hardwood industry roles"],
    requirements: mkReq(["330", "330", "345"], ["Minimum statutory NSC requirements for diploma entry must be met."]),
  },
];

function upsertUniversity(universities) {
  const idx = universities.findIndex((u) => u && u.id === university.id);
  if (idx === -1) {
    universities.push(university);
    return { added: 1, updated: 0 };
  }
  universities[idx] = { ...universities[idx], ...university };
  return { added: 0, updated: 1 };
}

function upsertProgrammes(existingProgrammes) {
  const byId = new Map();
  existingProgrammes.forEach((p, i) => {
    if (p && p.id) byId.set(p.id, i);
  });

  let added = 0;
  let updated = 0;

  for (const raw of programmes) {
    const id = `nmu-${slugify(raw.name)}`;
    const entry = {
      id,
      name: raw.name,
      field: raw.field,
      university: UNIVERSITY_NAME,
      universityShort: UNIVERSITY_SHORT,
      country: "za",
      minPoints: null,
      subjectRequirements: {},
      duration: raw.duration ?? null,
      durationYears: raw.durationYears ?? null,
      description: raw.description ?? null,
      officialUrl: null,
      applyUrl: null,
      modules: [],
      careers: raw.careers ?? [],
      applicationDeadline: null,
      minPointsSource: null,
      minPointsTier: "manual",
      minPointsScaleVersion: 2,
      profileCompleteness: "partial",
      sponsorshipTier: "standard",
      qualification: raw.qualification ?? null,
      campus: raw.campus ?? null,
      faculty: raw.faculty ?? null,
      requirements: raw.requirements ?? [],
    };

    if (byId.has(id)) {
      const i = byId.get(id);
      existingProgrammes[i] = { ...existingProgrammes[i], ...entry };
      updated++;
    } else {
      existingProgrammes.push(entry);
      byId.set(id, existingProgrammes.length - 1);
      added++;
    }
  }

  return { added, updated };
}

function main() {
  const universities = JSON.parse(fs.readFileSync(uniPath, "utf8"));
  const allProgrammes = JSON.parse(fs.readFileSync(progPath, "utf8"));

  const uniResult = upsertUniversity(universities);
  const progResult = upsertProgrammes(allProgrammes);

  fs.writeFileSync(uniPath, `${JSON.stringify(universities, null, 2)}\n`);
  fs.writeFileSync(progPath, `${JSON.stringify(allProgrammes, null, 2)}\n`);

  console.error(
    `NMU merge: university ${uniResult.added ? "added" : "updated"} (${UNIVERSITY_NAME}). ` +
      `Programmes: ${progResult.added} added, ${progResult.updated} updated (of ${programmes.length} transcribed).`
  );
}

main();
