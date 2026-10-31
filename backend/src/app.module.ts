import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { HealthModule } from './modules/health/health.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
        serverSelectionTimeoutMS: 5000,
        lazyConnection: true,
        connectionFactory: (connection: any) => {
          const logger = new Logger('MongoDB');
          connection.on('error', (err: any) => {
            logger.warn(`MongoDB connection issue: ${err.message}. Retrying in background...`);
          });
          connection.on('connected', () => {
            logger.log('MongoDB connected successfully');
          });
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    CatalogModule,
    InventoryModule,
    AiModule,
  ],
})
export class AppModule {}
