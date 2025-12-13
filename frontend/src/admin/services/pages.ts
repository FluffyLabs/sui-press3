import type { Page } from "../types/page";

// Mock data - in real app this would fetch from SUI smart contract
const MOCK_PAGES: Page[] = [
  {
    id: "1",
    path: "/index.html",
    walrusId: "GR6AiGuu5MJIiBPTGw5uEULqjvYZ9YGgtBa6-UwoTZQ",
    editors: [
      "0xDeployer123456789abcdef0123456789abcdef0123456789abcdef",
      "0xEditor1abcdef0123456789abcdef0123456789abcdef0123456789",
    ],
    registeredAtBlock: 1234567,
    updatedAtBlock: 1245890,
    previousWalrusId: null,
    content: "<h1>Welcome to Press3</h1><p>This is the home page.</p>",
  },
  {
    id: "2",
    path: "/wiki/press3.md",
    walrusId: "HT7BiHvv6NKJjCQUHx6vFVMrkwZA0AHhuCb7-VxpUaR",
    editors: [
      "0xEditor234567890abcdef0123456789abcdef0123456789abcdef01",
      "0xEditor345678901bcdef0123456789abcdef0123456789abcdef012",
      "0xEditor456789012cdef0123456789abcdef0123456789abcdef0123",
    ],
    registeredAtBlock: 1235000,
    updatedAtBlock: 1248920,
    previousWalrusId: "FP5AhFtt4MIGgBPSFw4tETKpivXY8XFfsAZ5-TvnSYP",
    content: "# Press3 Wiki\n\nThis is a decentralized CMS built on SUI.",
  },
  {
    id: "3",
    path: "/about.html",
    walrusId: "JV9CjJxx7OLKkDRVIy7wGWNslybB1BGhtDb8-WyqVbS",
    editors: ["0xAdmin567890123def0123456789abcdef0123456789abcdef01234"],
    registeredAtBlock: 1236500,
    updatedAtBlock: 1236500,
    previousWalrusId: null,
    content: "<h1>About Us</h1><p>Learn more about our project.</p>",
  },
  {
    id: "4",
    path: "/docs/getting-started.md",
    walrusId: "KW0DkKyy8PMllESWJz8xHXOtmzcC2CHiuEc9-XzrWcT",
    editors: [
      "0xWriter678901234ef0123456789abcdef0123456789abcdef012345",
      "0xReviewer789012345f0123456789abcdef0123456789abcdef0123456",
    ],
    registeredAtBlock: 1238000,
    updatedAtBlock: 1250100,
    previousWalrusId: "LX1ElLzz9QNmmFTXKa9yIYPunadD3DIjvFd0-YasXdU",
    content: "# Getting Started\n\nFollow these steps to begin using Press3...",
  },
];

export async function fetchPages(): Promise<Page[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_PAGES;
}

export async function fetchPageById(id: string): Promise<Page | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_PAGES.find((page) => page.id === id) || null;
}

export async function updatePage(
  id: string,
  updates: Partial<Page>,
): Promise<Page> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  const page = MOCK_PAGES.find((p) => p.id === id);
  if (!page) {
    throw new Error("Page not found");
  }
  Object.assign(page, updates);
  return page;
}
