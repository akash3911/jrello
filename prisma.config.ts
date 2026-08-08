import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://jrello:jrellopassword@localhost:5432/jrello?schema=public",
  },
});
