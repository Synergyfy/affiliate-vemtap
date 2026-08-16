import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { ObservabilityLoggingInterceptor } from "./observability/observability.interceptor";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useBodyParser("json", { limit: "10mb" });

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:4000",
      "http://localhost:4001",
      "https://affiliate.vemtap.com",
    ],
    credentials: true,
  });

  app.use(cookieParser());

  const observabilityInterceptor = app.get(ObservabilityLoggingInterceptor);
  app.useGlobalInterceptors(observabilityInterceptor);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // Unknown fields are stripped (whitelist) but NOT rejected, so external
      // partners like Vemtap can send extra fields without 400s.
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  // Warn loudly if the Vemtap integration key is missing — otherwise
  // /external/* and /agents/* requests silently fall back to DB-issued keys
  // and fail with 401 when neither is provisioned.
  const affiliateKey = app.get(ConfigService).get<string>("VEMTAP_AFFILIATE_KEY");
  if (!affiliateKey) {
    console.warn(
      "[WARN] VEMTAP_AFFILIATE_KEY is not set. x-api-key requests to /external/* and /agents/* will be rejected (401) unless a matching DB-issued API key exists.",
    );
  }

  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle("Vemtap API")
    .setDescription("Affiliate Management System API")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token (tokens are stored in cookies)",
        in: "cookie",
      },
      "JWT",
    )
    .addApiKey(
      {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "API key issued by an admin for external integrations",
      },
      "api-key",
    )
    .addApiKey(
      {
        type: "apiKey",
        in: "header",
        name: "x-vemtap-secret",
        description: "Shared secret for Vemtap internal integration",
      },
      "vemtap-secret",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.PORT || 4005;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
