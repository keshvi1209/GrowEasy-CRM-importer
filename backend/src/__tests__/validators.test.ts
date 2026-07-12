import {
  sanitizeEmail,
  sanitizePhone,
  sanitizeCountryCode,
  sanitizeCrmStatus,
  sanitizeDataSource,
  sanitizeDate,
  sanitizeText,
  sanitizeRecord,
  hasContactInfo,
} from "../utils/validators";

describe("sanitizeEmail", () => {
  it("accepts a valid email", () => {
    expect(sanitizeEmail("john@example.com")).toBe("john@example.com");
  });
  it("rejects an invalid email", () => {
    expect(sanitizeEmail("not-an-email")).toBe("");
  });
  it("handles empty/undefined", () => {
    expect(sanitizeEmail(undefined)).toBe("");
    expect(sanitizeEmail("")).toBe("");
  });
});

describe("sanitizePhone", () => {
  it("strips non-digit characters", () => {
    expect(sanitizePhone("98765-43210")).toBe("9876543210");
    expect(sanitizePhone("+91 98765 43210")).toBe("919876543210");
  });
});

describe("sanitizeCountryCode", () => {
  it("normalizes to a leading plus", () => {
    expect(sanitizeCountryCode("91")).toBe("+91");
    expect(sanitizeCountryCode("+91")).toBe("+91");
  });
  it("returns empty for blank input", () => {
    expect(sanitizeCountryCode("")).toBe("");
  });
});

describe("sanitizeCrmStatus", () => {
  it("accepts allowed values case-insensitively", () => {
    expect(sanitizeCrmStatus("good_lead_follow_up")).toBe("GOOD_LEAD_FOLLOW_UP");
  });
  it("rejects unknown statuses", () => {
    expect(sanitizeCrmStatus("Interested")).toBe("");
  });
});

describe("sanitizeDataSource", () => {
  it("accepts allowed values case-insensitively", () => {
    expect(sanitizeDataSource("Eden_Park")).toBe("eden_park");
  });
  it("rejects unknown sources", () => {
    expect(sanitizeDataSource("facebook_ads")).toBe("");
  });
});

describe("sanitizeDate", () => {
  it("keeps a parseable date string", () => {
    expect(sanitizeDate("2026-05-13 14:20:48")).toBe("2026-05-13 14:20:48");
  });
  it("blanks an unparseable date", () => {
    expect(sanitizeDate("not-a-date")).toBe("");
  });
});

describe("sanitizeText", () => {
  it("escapes literal newlines", () => {
    expect(sanitizeText("line1\nline2")).toBe("line1\\nline2");
  });
});

describe("sanitizeRecord + hasContactInfo", () => {
  it("builds a full record and flags missing contact info", () => {
    const record = sanitizeRecord({ name: "John Doe" });
    expect(record.name).toBe("John Doe");
    expect(hasContactInfo(record)).toBe(false);
  });

  it("passes when email is present", () => {
    const record = sanitizeRecord({ name: "John", email: "john@example.com" });
    expect(hasContactInfo(record)).toBe(true);
  });
});
