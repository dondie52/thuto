/**
 * Smoke tests for university fee schedule helpers.
 * Usage: node scripts/test-university-fees.mjs
 */
import assert from "assert";
import {
  computeGroupEstimates,
  formatFeeAmount,
  lookupProgrammeFeeGroup,
  resolveProgrammeFees,
} from "../src/lib/universityFees.js";

const bothoSchedule = {
  currency: "BWP",
  basis: "per_credit",
  normalSemesterCredits: 60,
  semestersPerYear: 2,
  groups: [
    {
      id: "engineering",
      name: "Engineering",
      aliases: ["Engineering"],
      fields: ["Engineering"],
      perCredit: 600,
      totalCredits: 600,
    },
    {
      id: "general",
      name: "General programmes",
      aliases: ["Business"],
      fields: ["Business"],
      perCredit: 420,
      totalCredits: 480,
    },
  ],
};

const bothoUniversity = { id: "botho", name: "Botho University", feeSchedule: bothoSchedule };

const engineeringProgramme = {
  id: "botho-beng",
  name: "Bachelor of Engineering in Mechanical Engineering",
  field: "Engineering",
  university: "Botho University",
};

const businessProgramme = {
  id: "botho-bba",
  name: "Bachelor of Business Administration in Business Management",
  field: "Business",
  university: "Botho University",
};

const engEstimates = computeGroupEstimates(bothoSchedule, bothoSchedule.groups[0]);
assert.strictEqual(engEstimates.perCredit, 600);
assert.strictEqual(engEstimates.perSemester, 36000);
assert.strictEqual(engEstimates.totalProgramme, 360000);

const bizEstimates = computeGroupEstimates(bothoSchedule, bothoSchedule.groups[1]);
assert.strictEqual(bizEstimates.perSemester, 25200);
assert.strictEqual(bizEstimates.totalProgramme, 201600);

const engLookup = lookupProgrammeFeeGroup(bothoUniversity, engineeringProgramme);
assert.strictEqual(engLookup.group.id, "engineering");

const bizLookup = lookupProgrammeFeeGroup(bothoUniversity, businessProgramme);
assert.strictEqual(bizLookup.group.id, "general");

const engResolved = resolveProgrammeFees(engineeringProgramme, bothoUniversity);
assert.strictEqual(engResolved.source, "schedule");
assert.strictEqual(engResolved.scheduleLookup.estimates.perSemester, 36000);

assert.strictEqual(formatFeeAmount(36000, "BWP"), "BWP 36,000");

console.log("universityFees tests passed");
