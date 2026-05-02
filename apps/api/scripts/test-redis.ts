import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RedisService } from '../src/redis/redis.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const redisService = app.get(RedisService);
  const cacheManager = app.get<Cache>(CACHE_MANAGER);

  console.log('--- Testing Direct Redis Access ---');
  await redisService.set('test_key', 'Hello Redis!');
  const val = await redisService.get('test_key');
  console.log('Value from Redis:', val);
  await redisService.del('test_key');

  console.log('\n--- Testing Cache Manager ---');
  await cacheManager.set('cache_key', { hello: 'world' }, 10000);
  const cachedVal = await cacheManager.get('cache_key');
  console.log('Value from Cache Manager:', cachedVal);

  await app.close();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
