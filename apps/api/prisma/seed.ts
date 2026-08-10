import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type HierarchyNode = {
  id: string;
  name: string;
  type: "COUNTRY" | "STATE" | "CITY" | "AREA" | "CLUSTER";
  parentId?: string | null;
  totalBusinesses?: number;
  penetration?: number;
};

// Ids match the hardcoded centers/zoom in the admin map (getCenterForNode/getZoomForNode).
const tree: HierarchyNode[] = [
  { id: "ng", name: "Nigeria", type: "COUNTRY", parentId: null },
  { id: "fct", name: "FCT Abuja", type: "STATE", parentId: "ng" },
  { id: "abuja", name: "Abuja", type: "CITY", parentId: "fct" },
  { id: "wuse", name: "Wuse", type: "AREA", parentId: "abuja", totalBusinesses: 250 },
  { id: "banex", name: "Banex Plaza", type: "CLUSTER", parentId: "wuse", totalBusinesses: 120 },
  { id: "wuse-mkt", name: "Wuse Market", type: "CLUSTER", parentId: "wuse", totalBusinesses: 90 },
  { id: "garki", name: "Garki", type: "AREA", parentId: "abuja", totalBusinesses: 180 },
  { id: "garki-mkt", name: "Garki Market", type: "CLUSTER", parentId: "garki", totalBusinesses: 60 },
];

async function main() {
  for (const node of tree) {
    const { id, parentId, ...data } = node;
    await prisma.marketMappingHierarchy.upsert({
      where: { id },
      update: { ...data, parentId },
      create: { id, parentId, ...data },
    });
    console.log(`✓ ${node.type}: ${node.name}`);
  }

  const first = await prisma.performanceConfig.findFirst();
  if (!first) {
    await prisma.performanceConfig.create({ data: {} });
    console.log("✓ PerformanceConfig: default row seeded");
  } else {
    console.log("✓ PerformanceConfig: already present");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
