import { Body, Controller, Get, Headers, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { DonationStatus } from '@prisma/client';
import { GivingService } from './giving.service';
import { WalletService } from './wallet.service';
import { CreateDonationDto, TopupWalletDto, SetDefaultFundDto, SendToFundDto, WebhookDto } from './dto/giving.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('giving')
@ApiBearerAuth()
@Controller('giving')
export class GivingController {
  constructor(
    private readonly giving: GivingService,
    private readonly wallet: WalletService,
  ) {}

  @Get('funds')
  @ApiOperation({ summary: 'Liste des fonds' })
  funds() {
    return this.giving.listFunds();
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'Méthodes de paiement disponibles' })
  paymentMethods() {
    return this.giving.listPaymentMethods();
  }

  @Post('donations')
  @ApiOperation({ summary: 'Crée un don (initie le paiement)' })
  createDonation(@CurrentUser('id') userId: string, @Body() dto: CreateDonationDto) {
    return this.giving.createDonation(userId, dto);
  }

  @Get('donations')
  @ApiOperation({ summary: 'Historique de mes dons' })
  myDonations(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.giving.listDonations(userId, query);
  }

  @Get('donations/:id')
  @ApiOperation({ summary: 'Reçu / détail d’un don' })
  getDonation(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    const isStaff = user.role === 'pastor' || user.role === 'admin';
    return this.giving.getDonation(user.id, id, isStaff);
  }

  // ── Webhook provider (public, signature vérifiée) ──
  @Public()
  @Post('webhooks/:provider')
  @ApiOperation({ summary: 'Webhook provider de paiement (signé)' })
  webhook(
    @Param('provider') _provider: string,
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-signature') signature: string,
    @Body() body: WebhookDto,
  ) {
    const raw = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(body);
    return this.giving.handleWebhook(raw, signature, body as unknown as Record<string, unknown>);
  }

  // ── Wallet ──
  @Get('wallet')
  @ApiOperation({ summary: 'Wallet Amen' })
  getWallet(@CurrentUser('id') userId: string) {
    return this.wallet.getWallet(userId);
  }

  @Post('wallet/topup')
  @ApiOperation({ summary: 'Recharge le wallet' })
  topup(@CurrentUser('id') userId: string, @Body() dto: TopupWalletDto) {
    return this.wallet.topup(userId, dto);
  }

  @Post('wallet/send')
  @ApiOperation({ summary: 'Envoie des coins du wallet vers un fonds (débite le solde)' })
  sendToFund(@CurrentUser('id') userId: string, @Body() dto: SendToFundDto) {
    return this.wallet.sendToFund(userId, dto);
  }

  @Patch('wallet/default-fund')
  @ApiOperation({ summary: 'Change le fonds par défaut du wallet' })
  setDefaultFund(@CurrentUser('id') userId: string, @Body() dto: SetDefaultFundDto) {
    return this.wallet.setDefaultFund(userId, dto);
  }

  @Get('wallet/transactions')
  @ApiOperation({ summary: 'Transactions du wallet' })
  transactions(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.wallet.listTransactions(userId, query);
  }

  // ── Dashboard (pastor+) ──
  @Get('admin/donations')
  @Roles('pastor')
  @ApiOperation({ summary: 'Tous les dons (staff)' })
  adminDonations(
    @Query() query: PaginationQueryDto,
    @Query('fund') fundId?: string,
    @Query('method') method?: string,
    @Query('status') status?: DonationStatus,
  ) {
    return this.giving.listAllDonations(query, { fundId, method, status });
  }

  @Get('admin/summary')
  @Roles('pastor')
  @ApiOperation({ summary: 'KPIs dons (staff)' })
  adminSummary() {
    return this.giving.summary();
  }

  @Get('admin/export')
  @Roles('admin')
  @ApiOperation({ summary: 'Export CSV financier (admin)' })
  async adminExport() {
    const csv = await this.giving.exportCsv();
    return { csv };
  }
}
