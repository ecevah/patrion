import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Global exception filter'ı uygula
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // CORS ayarları
  app.enableCors();
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log("\n=== Sunucu Durumu ===");
  console.log(`🚀 Server çalışıyor: http://localhost:${port}`);
  console.log("============================\n");
  // Database connection status
  try {
    // Get TypeORM DataSource from Nest app (already initialized)
    const dataSource = app.get(DataSource);

    console.log("\n=== Veritabanı Durumu ===");
    console.log("✅ PostgreSQL bağlantısı başarılı");
    console.log(`📦 Database: ${process.env.DB_NAME}`);
    console.log(`🌐 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`👤 User: ${process.env.DB_USER}`);

    // List all tables
    const queryRunner = dataSource.createQueryRunner();
    console.log("============================\n");
    logger.log("Database connection has been established successfully.");
    await queryRunner.release();
  } catch (error) {
    console.error("\n❌ PostgreSQL bağlantı hatası:");
    console.error(`🚫 Hata mesajı: ${error.message}`);
    console.error(
      "⚠️  Lütfen .env dosyasındaki veritabanı bilgilerini kontrol edin"
    );
    console.error("⚠️  PostgreSQL servisinin çalıştığından emin olun\n");
    logger.error("Unable to connect to the database:", error);
  }
}
bootstrap();
