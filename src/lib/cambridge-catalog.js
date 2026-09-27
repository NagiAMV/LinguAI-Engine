const FALLBACK_BOOK_COUNT = 19;
const TEST_COUNT = 4;
const TEST_DIFFICULTIES = ["Core", "Mixed", "Timed", "Challenge"];

function titleCase(value) {
  return `${String(value || "").slice(0, 1).toUpperCase()}${String(
    value || "",
  ).slice(1)}`;
}

function levelForBook(bookNumber) {
  if (bookNumber <= 8) return "Foundation";
  if (bookNumber <= 14) return "Intermediate";
  if (bookNumber <= 19) return "Advanced";
  return "Latest";
}

function decodeText(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
}

function parseCambridgeTest(item, resource) {
  const haystack = decodeText(`${item?.title || ""} ${item?.url || ""}`)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const match = haystack.match(
    /cambridge(?:\s+ielts)?\s+(\d+).*?(listening|reading|writing|speaking)?\s*test\s*([1-4])/i,
  );

  if (!match) return null;

  const [, rawBook, rawResource, rawTest] = match;
  const parsedResource = rawResource?.toLowerCase();

  if (parsedResource && parsedResource !== resource) return null;

  return {
    bookId: Number(rawBook),
    testId: Number(rawTest),
    sourceTitle: item?.title || `Cambridge ${rawBook} Test ${rawTest}`,
    url: item?.url || "",
  };
}

function makeFallbackBook(bookNumber, resource) {
  return {
    id: bookNumber,
    title: `Cambridge ${bookNumber}`,
    label: `Book ${bookNumber}`,
    level: levelForBook(bookNumber),
    sourceCount: 0,
    tests: Array.from({ length: TEST_COUNT }, (_, index) => {
      const testNumber = index + 1;
      return {
        id: testNumber,
        title: `Test ${testNumber}`,
        mode: titleCase(resource),
        difficulty: TEST_DIFFICULTIES[index],
        testId: `cambridge_${bookNumber}_test_${testNumber}`,
        source: "local-index",
        sourceTitle: "",
        url: "",
      };
    }),
  };
}

export function createCambridgeBooks(resource, sourceItems = []) {
  const parsedItems = sourceItems
    .map((item) => parseCambridgeTest(item, resource))
    .filter(Boolean);
  const maxBook = Math.max(
    FALLBACK_BOOK_COUNT,
    ...parsedItems.map((item) => item.bookId),
  );
  const books = Array.from({ length: maxBook }, (_, index) =>
    makeFallbackBook(index + 1, resource),
  );

  for (const sourceItem of parsedItems) {
    const book = books[sourceItem.bookId - 1];
    const test = book?.tests[sourceItem.testId - 1];
    if (!book || !test) continue;

    test.source = "engnovate";
    test.sourceTitle = sourceItem.sourceTitle;
    test.url = sourceItem.url;
  }

  return books.map((book) => ({
    ...book,
    sourceCount: book.tests.filter((test) => test.url).length,
  }));
}

export function countLinkedTests(books) {
  return books.reduce((total, book) => total + book.sourceCount, 0);
}
