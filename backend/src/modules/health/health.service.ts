import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  check() {
    return {
      success: true,
      service: 'SMB Smart Inventory Backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    };
  }
}
