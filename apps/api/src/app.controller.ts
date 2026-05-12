import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("system")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: "API root endpoint",
    description: "Returns a welcome message confirming the API is running.",
  })
  @ApiResponse({
    status: 200,
    description: "Welcome message",
    example: "Welcome to Vemtap Affiliate API!",
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("health")
  @ApiOperation({
    summary: "Health check",
    description:
      "Returns the health status of the API. Use this endpoint to verify the service is running.",
  })
  @ApiResponse({
    status: 200,
    description: "Service is healthy",
    example: { status: "ok", timestamp: "2026-05-06T10:00:00.000Z" },
  })
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
