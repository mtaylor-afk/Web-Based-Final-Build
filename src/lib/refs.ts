import { prisma } from "./prisma";

/**
 * Generate the next sequential reference number for a document type.
 * Uses a database counter to ensure uniqueness.
 */
export async function getNextRef(type: "quote" | "invoice" | "signoff"): Promise<string> {
  const prefixMap = {
    quote: "WVC-Q-",
    invoice: "WVC-I-",
    signoff: "WVC-S-",
  };

  const counter = await prisma.refCounter.update({
    where: { id: type },
    data: { current: { increment: 1 } },
  });

  return `${prefixMap[type]}${counter.current}`;
}
