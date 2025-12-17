import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config()

export async function connectToDatabase() {
  const password = process.env.DB_PASSWORD;
  const uri = `mongodb+srv://davisouzag:${password}@alura.vhseurb.mongodb.net/brubru`;

  try {
    await mongoose.connect(uri, {
      dbName: "ecommerce",
    });

    console.log("Conectado ao banco com sucesso");
  } catch (error) {
    console.error("Erro ao conectar ao banco:", error);
    process.exit(1);
  }
}