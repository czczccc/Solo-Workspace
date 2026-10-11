import { createDb } from "@/lib/db";

export function memoryDb() {
  return createDb(":memory:");
}
