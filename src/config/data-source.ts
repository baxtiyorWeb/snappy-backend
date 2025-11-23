import { DataSource } from "typeorm";
import { config } from "dotenv";
config();

// Universal DataSource konfiguratsiyasi (migration va app uchun bir xil)
export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL, // ✅ yagona connection string
  synchronize: true, // productionda hech qachon true bo‘lmasin
  logging: true,

  // ✅ TypeORM uchun to‘g‘ri pathlar
  entities: ["dist/**/*.entity{.ts,.js}"],
  migrations: ["dist/migrations/*{.ts,.js}"],

  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});
//