import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:4000",
      "http://localhost:4001",
    ],
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

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
