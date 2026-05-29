import { Injectable, Logger } from '@nestjs/common';

export const SMS_PROVIDER = 'SMS_PROVIDER';

/** Interface abstraite d'envoi de SMS (Twilio, agrégateur RDC, etc. interchangeables). */
export interface SmsProvider {
  sendOtp(phone: string, code: string): Promise<void>;
}

/** Implémentation de dev : log le code en console (aucun SMS réel envoyé). */
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger('ConsoleSms');

  async sendOtp(phone: string, code: string): Promise<void> {
    this.logger.log(`OTP pour ${phone} : ${code}`);
  }
}
