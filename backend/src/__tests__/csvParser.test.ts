import { parseCsv, CsvParseError } from "../services/csvParser";

describe("parseCsv", () => {
  it("parses a well-formed CSV with headers", () => {
    const csv = "Name,Email\nJohn Doe,john@example.com\nJane,jane@example.com";
    const { headers, rows } = parseCsv(Buffer.from(csv));
    expect(headers).toEqual(["Name", "Email"]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ Name: "John Doe", Email: "john@example.com" });
  });

  it("strips a UTF-8 BOM", () => {
    const csv = "\uFEFFName,Email\nJohn,john@example.com";
    const { headers } = parseCsv(Buffer.from(csv));
    expect(headers[0]).toBe("Name");
  });

  it("throws on an empty file", () => {
    expect(() => parseCsv(Buffer.from(""))).toThrow(CsvParseError);
  });

  it("throws on a header-only file with no data rows", () => {
    expect(() => parseCsv(Buffer.from("Name,Email\n"))).toThrow(CsvParseError);
  });

  it("tolerates ragged rows with relax_column_count", () => {
    const csv = "Name,Email,Phone\nJohn,john@example.com\nJane,jane@example.com,999,extra";
    const { rows } = parseCsv(Buffer.from(csv));
    expect(rows).toHaveLength(2);
  });
});
