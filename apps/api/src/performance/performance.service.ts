import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  PerformancePeriodType,
  PerformanceStatus,
  BusinessStatus,
} from '@prisma/client';
import { haversineDistance } from './lead-quality.util';

const WORKING_DAYS = 22;

export interface PeriodBounds {
  start: Date;
  end: Date;
}

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  private periodBounds(period: PerformancePeriodType, now = new Date()): PeriodBounds {
    const start = new Date(now);
    const end = new Date(now);
    if (period === PerformancePeriodType.DAILY) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === PerformancePeriodType.WEEKLY) {
      const day = (now.getDay() + 6) % 7; // Monday = 0
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  }

  private async getConfig() {
    const config = await this.prisma.performanceConfig.findFirst();
    return config;
  }

  async updateConfig(dto: any) {
    const current = await this.getConfig();
    if (!current) {
      return this.prisma.performanceConfig.create({ data: dto });
    }
    return this.prisma.performanceConfig.update({
      where: { id: current.id },
      data: dto,
    });
  }

  private scaleTarget(target: number, period: PerformancePeriodType): number {
    if (period === PerformancePeriodType.MONTHLY) return target;
    if (period === PerformancePeriodType.WEEKLY) return Math.round(target / (WORKING_DAYS / 5));
    return Math.max(1, Math.round(target / WORKING_DAYS));
  }

  async getLeadQualityStats(
    userId: string,
    period: PerformancePeriodType,
    now = new Date(),
  ) {
    const { start, end } = this.periodBounds(period, now);

    const leads = await this.prisma.lead.findMany({
      where: {
        userId,
        createdAt: { gte: start, lte: end },
        deletedAt: null,
        isPlaceholder: false,
      },
      select: {
        id: true,
        status: true,
        phone: true,
        gpsLat: true,
        gpsLng: true,
        visitedAt: true,
      },
    });

    const submitted = leads.length;
    const visited = leads.filter((l) => l.visitedAt != null).length;
    // A lead is "qualified" once it has been visited and its contact + GPS info
    // was captured (adequate to follow up).
    const qualified = leads.filter(
      (l) => l.visitedAt != null && l.phone && l.gpsLat && l.gpsLng,
    ).length;
    const invalid = leads.filter((l) => l.visitedAt == null && !l.phone).length;

    return {
      submitted,
      qualified,
      visited,
      duplicates: 0,
      rejected: 0,
      invalid,
    };
  }

  async getLeadQualityScore(
    userId: string,
    period: PerformancePeriodType,
    now = new Date(),
  ) {
    const { start, end } = this.periodBounds(period, now);
    const leads = await this.prisma.lead.findMany({
      where: {
        userId,
        createdAt: { gte: start, lte: end },
        deletedAt: null,
        isPlaceholder: false,
      },
      select: {
        status: true,
        phone: true,
        gpsLat: true,
        gpsLng: true,
        visitedAt: true,
      },
    });
    if (leads.length === 0) return 0;
    return Math.round(
      (leads.filter(
        (l) => l.visitedAt != null && l.phone && l.gpsLat && l.gpsLng,
      ).length /
        leads.length) *
        100,
    );
  }

  private async getFieldActivity(
    userId: string,
    period: PerformancePeriodType,
    now = new Date(),
  ) {
    const { start, end } = this.periodBounds(period, now);
    const config = await this.getConfig();
    const [gpsVisits, totalVisits] = await Promise.all([
      this.prisma.lead.count({
        where: {
          userId,
          deletedAt: null,
          isPlaceholder: false,
          visitedAt: { gte: start, lte: end },
          gpsLat: { not: null },
          gpsLng: { not: null },
        },
      }),
      this.prisma.lead.count({
        where: {
          userId,
          deletedAt: null,
          isPlaceholder: false,
          visitedAt: { gte: start, lte: end },
        },
      }),
    ]);
    const visitTarget =
      (config?.dailyVisitTarget ?? 0) > 0
        ? this.scaleTarget(config?.dailyVisitTarget ?? 0, period)
        : this.scaleTarget(config?.dailyLeadTarget ?? 20, period);
    return { gpsVisits, totalVisits, visitTarget };
  }

  private async getFollowUps(
    userId: string,
    period: PerformancePeriodType,
    now = new Date(),
  ) {
    const { start, end } = this.periodBounds(period, now);
    const config = await this.getConfig();
    const completed = await this.prisma.marketMappingNote.count({
      where: { userId, createdAt: { gte: start, lte: end } },
    });
    const followUpTarget = this.scaleTarget(config?.followUpTarget ?? 20, period);
    return { completed, followUpTarget };
  }

  private async getDemos(
    userId: string,
    period: PerformancePeriodType,
    now = new Date(),
  ) {
    const { start, end } = this.periodBounds(period, now);
    const config = await this.getConfig();
    const completed = await this.prisma.demo.count({
      where: { agentId: userId, status: 'COMPLETED', date: { gte: start, lte: end } },
    });
    const demoTarget = this.scaleTarget(config?.demoTarget ?? 80, period);
    return { completed, demoTarget };
  }

  private async getConversionsAndRevenue(
    userId: string,
    period: PerformancePeriodType,
    now = new Date(),
  ) {
    const { start, end } = this.periodBounds(period, now);
    const config = await this.getConfig();
    const [conversions, revenueAgg] = await Promise.all([
      this.prisma.business.count({
        where: {
          affiliateId: userId,
          status: BusinessStatus.ACTIVE,
          subscriptionAmount: { gt: 0 },
          paidAt: { gte: start, lte: end },
        },
      }),
      this.prisma.business.aggregate({
        where: {
          affiliateId: userId,
          status: BusinessStatus.ACTIVE,
          subscriptionAmount: { gt: 0 },
          paidAt: { gte: start, lte: end },
        },
        _sum: { subscriptionAmount: true },
      }),
    ]);
    const conversionTarget = this.scaleTarget(config?.conversionTarget ?? 20, period);
    const revenueTarget = this.scaleTarget(
      Number(config?.revenueTarget ?? 0),
      period,
    );
    return {
      conversions,
      conversionTarget,
      revenue: Number(revenueAgg._sum.subscriptionAmount ?? 0),
      revenueTarget,
    };
  }

  private pct(actual: number, target: number): number {
    if (target <= 0) return actual > 0 ? 100 : 0;
    return Math.min(Math.round((actual / target) * 100), 100);
  }

  async computeScore(
    userId: string,
    period: PerformancePeriodType,
    now = new Date(),
  ) {
    const config = await this.getConfig();
    const totalWeight =
      Number(config?.weightQualifiedLead ?? 20) +
      Number(config?.weightLeadQuality ?? 10) +
      Number(config?.weightFieldActivity ?? 15) +
      Number(config?.weightFollowUp ?? 10) +
      Number(config?.weightDemo ?? 10) +
      Number(config?.weightConversion ?? 20) +
      Number(config?.weightRevenue ?? 15);

    const weights = {
      qualifiedLead: Number(config?.weightQualifiedLead ?? 20),
      leadQuality: Number(config?.weightLeadQuality ?? 10),
      fieldActivity: Number(config?.weightFieldActivity ?? 15),
      followUp: Number(config?.weightFollowUp ?? 10),
      demo: Number(config?.weightDemo ?? 10),
      conversion: Number(config?.weightConversion ?? 20),
      revenue: Number(config?.weightRevenue ?? 15),
    };

    const [leadStats, leadQualityScore, field, followUps, demos, conv] =
      await Promise.all([
        this.getLeadQualityStats(userId, period, now),
        this.getLeadQualityScore(userId, period, now),
        this.getFieldActivity(userId, period, now),
        this.getFollowUps(userId, period, now),
        this.getDemos(userId, period, now),
        this.getConversionsAndRevenue(userId, period, now),
      ]);

    const targetLeads =
      period === PerformancePeriodType.MONTHLY
        ? config?.monthlyLeadTarget ?? 400
        : period === PerformancePeriodType.WEEKLY
          ? config?.weeklyLeadTarget ?? 100
          : config?.dailyLeadTarget ?? 20;

    const metrics = {
      qualifiedLead: {
        score: this.pct(leadStats.qualified, targetLeads),
        actual: leadStats.qualified,
        target: targetLeads,
      },
      leadQuality: {
        score: leadQualityScore,
        actual: leadQualityScore,
        target: 100,
      },
      fieldActivity: {
        score: this.pct(field.gpsVisits, field.visitTarget),
        actual: field.gpsVisits,
        target: field.visitTarget,
      },
      followUp: {
        score: this.pct(followUps.completed, followUps.followUpTarget),
        actual: followUps.completed,
        target: followUps.followUpTarget,
      },
      demo: {
        score: this.pct(demos.completed, demos.demoTarget),
        actual: demos.completed,
        target: demos.demoTarget,
      },
      conversion: {
        score: this.pct(conv.conversions, conv.conversionTarget),
        actual: conv.conversions,
        target: conv.conversionTarget,
      },
      revenue: {
        score: this.pct(conv.revenue, conv.revenueTarget),
        actual: conv.revenue,
        target: conv.revenueTarget,
      },
    };

    const weightedSum =
      metrics.qualifiedLead.score * weights.qualifiedLead +
      metrics.leadQuality.score * weights.leadQuality +
      metrics.fieldActivity.score * weights.fieldActivity +
      metrics.followUp.score * weights.followUp +
      metrics.demo.score * weights.demo +
      metrics.conversion.score * weights.conversion +
      metrics.revenue.score * weights.revenue;

    const score = Math.round(totalWeight > 0 ? weightedSum / totalWeight : 0);
    const threshold = Number(config?.performanceThreshold ?? 90);
    const excellent = Number(config?.excellentThreshold ?? 100);

    let status: PerformanceStatus = PerformanceStatus.AT_RISK;
    if (score >= excellent) status = PerformanceStatus.EXCELLENT;
    else if (score >= threshold) status = PerformanceStatus.ON_TRACK;

    return {
      score,
      status,
      threshold,
      required: threshold,
      weights,
      totalWeight,
      metrics,
      period,
      periodBounds: this.periodBounds(period, now),
    };
  }

  getStatusLabel(status: PerformanceStatus) {
    switch (status) {
      case PerformanceStatus.EXCELLENT:
        return { label: 'Excellent', color: 'green' };
      case PerformanceStatus.ON_TRACK:
        return { label: 'On Track', color: 'green' };
      default:
        return { label: 'At Risk', color: 'red' };
    }
  }

  async getRecoveryPlan(
    userId: string,
    period: PerformancePeriodType,
    now = new Date(),
  ) {
    const result = await this.computeScore(userId, period, now);
    const suggestions: string[] = [];
    const { metrics } = result;

    if (metrics.qualifiedLead.actual < metrics.qualifiedLead.target) {
      suggestions.push(
        `${metrics.qualifiedLead.target - metrics.qualifiedLead.actual} more qualified lead(s) needed`,
      );
    }
    if (metrics.followUp.actual < metrics.followUp.target) {
      suggestions.push(
        `${metrics.followUp.target - metrics.followUp.actual} more follow-up(s) needed`,
      );
    }
    if (metrics.demo.actual < metrics.demo.target) {
      suggestions.push(
        `${metrics.demo.target - metrics.demo.actual} more demo(s)/meeting(s) needed`,
      );
    }
    if (metrics.conversion.actual < metrics.conversion.target) {
      suggestions.push(
        `${metrics.conversion.target - metrics.conversion.actual} more conversion(s) needed`,
      );
    }
    if (metrics.fieldActivity.actual < metrics.fieldActivity.target) {
      suggestions.push(
        `${metrics.fieldActivity.target - metrics.fieldActivity.actual} more GPS-verified visit(s) needed`,
      );
    }
    if (metrics.leadQuality.score < 90) {
      suggestions.push(
        'Improve lead quality — capture more complete business details',
      );
    }

    return {
      score: result.score,
      status: result.status,
      deficitPoints: Math.max(0, result.required - result.score),
      suggestions,
      message:
        result.score >= result.required
          ? 'You are on track. Keep it up!'
          : `Complete these activities to improve your score: ${suggestions.join(', ')}`,
    };
  }

  async getTodaySummary(userId: string, now = new Date()) {
    const config = await this.getConfig();
    const dailyLeadTarget = config?.dailyLeadTarget ?? 20;
    const { start, end } = this.periodBounds(PerformancePeriodType.DAILY, now);

    const [leadStats, visits, demos, followUps, conversions] = await Promise.all([
      this.getLeadQualityStats(userId, PerformancePeriodType.DAILY, now),
      this.prisma.lead.count({
        where: {
          userId,
          deletedAt: null,
          isPlaceholder: false,
          visitedAt: { gte: start, lte: end },
        },
      }),
      this.prisma.demo.count({
        where: { agentId: userId, status: 'COMPLETED', date: { gte: start, lte: end } },
      }),
      this.prisma.marketMappingNote.count({
        where: { userId, createdAt: { gte: start, lte: end } },
      }),
      this.prisma.business.count({
        where: {
          affiliateId: userId,
          status: BusinessStatus.ACTIVE,
          subscriptionAmount: { gt: 0 },
          paidAt: { gte: start, lte: end },
        },
      }),
    ]);

    const performance = await this.computeScore(userId, PerformancePeriodType.DAILY, now);

    return {
      performance,
      dailyTargets: {
        leads: dailyLeadTarget,
        visits: config?.dailyVisitTarget ?? dailyLeadTarget,
        demos: this.scaleTarget(config?.demoTarget ?? 80, PerformancePeriodType.DAILY),
        followUps: this.scaleTarget(config?.followUpTarget ?? 20, PerformancePeriodType.DAILY),
        conversions: this.scaleTarget(
          config?.conversionTarget ?? 20,
          PerformancePeriodType.DAILY,
        ),
      },
      today: {
        leads: { submitted: leadStats.submitted, qualified: leadStats.qualified, target: dailyLeadTarget },
        visits: { done: visits, target: config?.dailyVisitTarget ?? dailyLeadTarget },
        demos: { done: demos, target: this.scaleTarget(config?.demoTarget ?? 80, PerformancePeriodType.DAILY) },
        followUps: { done: followUps, target: this.scaleTarget(config?.followUpTarget ?? 20, PerformancePeriodType.DAILY) },
        conversions: { done: conversions, target: this.scaleTarget(config?.conversionTarget ?? 20, PerformancePeriodType.DAILY) },
      },
    };
  }

  // ---- Visit transition analysis ----

  async getVisitTransitions(userId: string, date?: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      start.setTime(d.getTime());
      end.setTime(d.getTime());
      end.setHours(23, 59, 59, 999);
    }

    const config = await this.getConfig();
    const maxGap = config?.maxTransitionGapMinutes ?? 45;

    const visits = await this.prisma.lead.findMany({
      where: {
        userId,
        deletedAt: null,
        isPlaceholder: false,
        visitedAt: { gte: start, lte: end },
        gpsLat: { not: null },
        gpsLng: { not: null },
      },
      orderBy: { visitedAt: 'asc' },
    });

    const transitions = [];
    for (let i = 1; i < visits.length; i++) {
      const prev = visits[i - 1];
      const next = visits[i];
      const lat1 = parseFloat(prev.gpsLat!);
      const lng1 = parseFloat(prev.gpsLng!);
      const lat2 = parseFloat(next.gpsLat!);
      const lng2 = parseFloat(next.gpsLng!);
      if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) continue;

      const distance = haversineDistance(lat1, lng1, lat2, lng2);
      const gapMinutes = Math.round(
        (next.visitedAt!.getTime() - prev.visitedAt!.getTime()) / 60000,
      );
      const estimatedTravelMinutes = Math.max(1, Math.round(distance / 60));
      const longTransition = gapMinutes > estimatedTravelMinutes + maxGap;

      transitions.push({
        from: prev.businessName,
        to: next.businessName,
        fromTime: prev.visitedAt,
        toTime: next.visitedAt,
        distanceMeters: Math.round(distance),
        gapMinutes,
        estimatedTravelMinutes,
        longTransition,
      });
    }

    return {
      count: visits.length,
      transitions,
      longTransitions: transitions.filter((t) => t.longTransition).length,
    };
  }

  // ---- Persisted snapshots (hybrid scoring) ----

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async snapshotDailyScores() {
    const salesExecs = await this.prisma.user.findMany({
      where: { role: 'SALES_EXECUTIVE', status: 'ACTIVE' },
      select: { id: true },
    });
    const period = PerformancePeriodType.DAILY;
    const now = new Date();
    const { start, end } = this.periodBounds(period, now);

    for (const user of salesExecs) {
      const result = await this.computeScore(user.id, period, now);
      await this.prisma.performanceScore.upsert({
        where: {
          userId_periodType_periodStart: {
            userId: user.id,
            periodType: period,
            periodStart: start,
          },
        },
        create: {
          userId: user.id,
          periodType: period,
          periodStart: start,
          periodEnd: end,
          score: result.score,
          status: result.status,
          breakdown: result.metrics as any,
        },
        update: {
          score: result.score,
          status: result.status,
          breakdown: result.metrics as any,
          periodEnd: end,
        },
      });
    }
    return { snapped: salesExecs.length, period, periodStart: start };
  }

  async getScoreHistory(userId: string, periodType: PerformancePeriodType) {
    return this.prisma.performanceScore.findMany({
      where: { userId, periodType },
      orderBy: { periodStart: 'desc' },
      take: 30,
    });
  }

  // ---- Admin ----

  async getTeamOverview(now = new Date()) {
    const { start, end } = this.periodBounds(PerformancePeriodType.DAILY, now);
    const salesExecs = await this.prisma.user.findMany({
      where: { role: 'SALES_EXECUTIVE', status: 'ACTIVE' },
      select: {
        id: true,
        fullName: true,
        avatar: true,
        territoryId: true,
        dailyLeadTarget: true,
      },
    });

    const sessions = await this.prisma.workSession.findMany({
      where: { startTime: { gte: start, lte: end } },
      select: { userId: true, status: true, startTime: true, lateStart: true },
    });
    const sessionMap = new Map(sessions.map((s) => [s.userId, s]));

    const members = [];
    for (const exec of salesExecs) {
      const leadStats = await this.getLeadQualityStats(
        exec.id,
        PerformancePeriodType.DAILY,
        now,
      );
      const perf = await this.computeScore(exec.id, PerformancePeriodType.DAILY, now);
      const conv = await this.getConversionsAndRevenue(
        exec.id,
        PerformancePeriodType.DAILY,
        now,
      );
      members.push({
        userId: exec.id,
        fullName: exec.fullName,
        avatar: exec.avatar,
        session: sessionMap.get(exec.id)
          ? {
              status: sessionMap.get(exec.id)!.status,
              startedAt: sessionMap.get(exec.id)!.startTime,
              lateStart: sessionMap.get(exec.id)!.lateStart,
            }
          : null,
        leads: { qualified: leadStats.qualified, target: exec.dailyLeadTarget || 20 },
        performance: perf.score,
        status: perf.status,
        revenue: conv.revenue,
      });
    }

    const activeToday = members.filter(
      (m) => m.session?.status === 'ACTIVE' || m.session?.status === 'ENDED',
    ).length;

    return {
      summary: {
        total: salesExecs.length,
        activeToday,
        notStartedToday: salesExecs.length - activeToday,
        averagePerformance: members.length
          ? Math.round(members.reduce((acc, m) => acc + m.performance, 0) / members.length)
          : 0,
        totalQualifiedLeads: members.reduce((acc, m) => acc + m.leads.qualified, 0),
        totalRevenue: members.reduce((acc, m) => acc + m.revenue, 0),
      },
      members,
    };
  }

  async getIndividualPerformance(userId: string, now = new Date()) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, avatar: true, role: true, territoryId: true },
    });
    if (!user) return null;

    const [daily, weekly, monthly, todaySummary, transitions] = await Promise.all([
      this.computeScore(userId, PerformancePeriodType.DAILY, now),
      this.computeScore(userId, PerformancePeriodType.WEEKLY, now),
      this.computeScore(userId, PerformancePeriodType.MONTHLY, now),
      this.getTodaySummary(userId, now),
      this.getVisitTransitions(userId),
    ]);

    return {
      user,
      daily,
      weekly,
      monthly,
      today: todaySummary,
      transitions,
      recovery: await this.getRecoveryPlan(userId, PerformancePeriodType.DAILY, now),
    };
  }
}
