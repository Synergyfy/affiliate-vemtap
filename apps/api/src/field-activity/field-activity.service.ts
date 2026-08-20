import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartVisitPayloadDto, CompleteVisitPayloadDto, TransitionExplanationDto } from './dto/field-activity.dto';
import { FieldTimelineEventType, TransitionStatus, VisitTransition } from '@prisma/client';
import { haversineDistance } from '../performance/lead-quality.util';
import { EngineService } from '../communication/engine/engine.service';

/**
 * Maps a field-work visit outcome to a valid Lead pipeline status. Field
 * outcomes like MANAGER_UNAVAILABLE / FOLLOW_UP_REQUIRED / OTHER are not valid
 * Lead statuses, so they collapse into VISITED (the visit still happened).
 */
export function mapVisitOutcomeToLeadStatus(
  outcome?: string | null,
): string {
  switch (outcome) {
    case 'CUSTOMER':
      return 'CUSTOMER';
    case 'INTERESTED':
      return 'INTERESTED';
    case 'NOT_INTERESTED':
      return 'NOT_INTERESTED';
    default:
      return 'VISITED';
  }
}

/**
 * Funnel precedence for the unified lead pipeline. Field outcomes that map to
 * VISITED must never downgrade a lead that is already further along (e.g. a
 * CONTACTED lead must not regress to VISITED when the field outcome is
 * FOLLOW_UP_REQUIRED). Explicit terminal outcomes (CUSTOMER / NOT_INTERESTED)
 * always apply.
 */
const FIELD_LEAD_STATUS_ORDER: Record<string, number> = {
  NOT_YET: 0,
  VISITED: 1,
  CONTACTED: 2,
  INTERESTED: 3,
  CUSTOMER: 4,
};

export function shouldApplyFieldLeadStatus(
  currentStatus: string,
  incomingStatus: string,
): boolean {
  if (incomingStatus === 'CUSTOMER' || incomingStatus === 'NOT_INTERESTED') {
    return true;
  }
  return (FIELD_LEAD_STATUS_ORDER[incomingStatus] ?? 0) >
    (FIELD_LEAD_STATUS_ORDER[currentStatus] ?? 0);
}

@Injectable()
export class FieldActivityService {
  private readonly logger = new Logger(FieldActivityService.name);

  constructor(
    private prisma: PrismaService,
    private readonly engineService: EngineService,
  ) {}

  async getActiveMission(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayPlan = await this.prisma.marketMappingPlan.findFirst({
      where: {
        userId,
        OR: [
          { startDate: { gte: today, lte: todayEnd } },
          { createdAt: { gte: today, lte: todayEnd } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dailyLeadTarget: true },
    });

    const targetCount = todayPlan?.targetVisits || user?.dailyLeadTarget || 20;
    const location = todayPlan?.locationCluster || 'Assigned Territory';

    let mission = await this.prisma.fieldMission.findFirst({
      where: {
        userId,
        createdAt: { gte: today },
      },
      include: {
        businesses: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (mission) {
      if (mission.targetCount !== targetCount || (todayPlan?.locationCluster && mission.location !== location)) {
        const currentCount = mission.businesses.length;
        if (targetCount > currentCount) {
          const needed = targetCount - currentCount;
          const newPlaceholders = Array.from({ length: needed }).map((_, i) => ({
            name: `Placeholder ${currentCount + i + 1}`,
            category: 'Unknown',
            address: location,
            isAnchor: false,
            isPlaceholder: true,
            status: 'NOT_YET',
          }));
          await this.prisma.fieldMissionBusiness.createMany({
            data: newPlaceholders.map((p) => ({ ...p, missionId: mission!.id })),
          });
        }
        mission = await this.prisma.fieldMission.update({
          where: { id: mission.id },
          data: { targetCount, location },
          include: { businesses: true },
        });
      }
    } else {
      // Find user's leads (market mapping pipeline businesses) or create default mission
      const leads = await this.prisma.lead.findMany({
        where: { userId, deletedAt: null },
        take: targetCount,
        orderBy: { createdAt: 'desc' },
      });

      const businessesData: Array<{
        leadId?: string;
        name: string;
        category: string;
        address?: string;
        gpsAddress?: string;
        isAnchor: boolean;
        isPlaceholder: boolean;
        status: string;
        dailyCustomers?: string;
        businessSize?: string;
      }> = leads.map((v) => ({
        leadId: v.id,
        name: v.businessName,
        category: v.industry || 'General',
        address: v.businessAddress || v.location || location,
        gpsAddress: v.gpsAddress || undefined,
        isAnchor: v.isAnchor,
        isPlaceholder: false,
        status: v.status || 'NOT_YET',
        dailyCustomers: v.dailyCustomers || 'MEDIUM',
        businessSize: v.businessSize || 'MEDIUM',
      }));

      // Add placeholders up to targetCount if needed
      const placeholderCount = Math.max(0, targetCount - businessesData.length);
      for (let i = 1; i <= placeholderCount; i++) {
        businessesData.push({
          name: `Placeholder ${businessesData.length + 1}`,
          category: 'Unknown',
          address: location,
          isAnchor: false,
          isPlaceholder: true,
          status: 'NOT_YET',
        });
      }

      mission = await this.prisma.fieldMission.create({
        data: {
          userId,
          name: `Daily Mission - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          location,
          targetCount,
          horizon: 'DAY',
          businesses: {
            create: businessesData,
          },
        },
        include: {
          businesses: true,
        },
      });

      // Record timeline event
      await this.prisma.fieldActivityTimelineEvent.create({
        data: {
          userId,
          missionId: mission.id,
          eventType: FieldTimelineEventType.WORK_STARTED,
          title: 'Daily Field Mission Initialized',
          description: `Initialized mission "${mission.name}" with ${businessesData.length} target businesses.`,
        },
      });
    }

    return {
      id: mission.id,
      name: mission.name,
      location: mission.location,
      targetCount: mission.targetCount,
      horizon: mission.horizon,
      startedAt: mission.startedAt,
      completedAt: mission.completedAt,
      businesses: mission.businesses.map((b) => ({
        id: b.id,
        leadId: b.leadId,
        name: b.name,
        category: b.category,
        address: b.address,
        gpsAddress: b.gpsAddress,
        isAnchor: b.isAnchor,
        isPlaceholder: b.isPlaceholder,
        status: b.status,
        dailyCustomers: b.dailyCustomers,
        businessSize: b.businessSize,
      })),
    };
  }

  async getMissionProgress(userId: string, missionId: string) {
    const mission = await this.prisma.fieldMission.findFirst({
      where: { id: missionId, userId },
      include: { businesses: true },
    });

    if (!mission) {
      throw new NotFoundException(`Mission with ID ${missionId} not found`);
    }

    const totalBusinesses = mission.businesses.length;
    const visitedCount = mission.businesses.filter((b) => b.status !== 'NOT_YET').length;
    const leadsCaptured = mission.businesses.filter((b) => ['CONTACTED', 'INTERESTED', 'CUSTOMER'].includes(b.status)).length;
    const interestedCount = mission.businesses.filter((b) => b.status === 'INTERESTED').length;
    const conversions = mission.businesses.filter((b) => b.status === 'CUSTOMER').length;

    // Follow-ups from notes
    const followUps = await this.prisma.marketMappingNote.count({
      where: { userId, followUpDate: { not: null } },
    });

    const remaining = Math.max(0, totalBusinesses - visitedCount);
    const percentComplete = totalBusinesses > 0 ? Math.round((visitedCount / totalBusinesses) * 100) : 0;

    return {
      totalBusinesses,
      visitedCount,
      leadsCaptured,
      interestedCount,
      followUps,
      conversions,
      remaining,
      percentComplete,
    };
  }

  async getMissionTimeline(userId: string, missionId: string) {
    const events = await this.prisma.fieldActivityTimelineEvent.findMany({
      where: { userId, missionId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      title: e.title,
      description: e.description,
      createdAt: e.createdAt,
      metadata: e.metadata,
    }));
  }

  async startVisit(userId: string, dto: StartVisitPayloadDto) {
    let missionId = dto.missionId;
    if (!missionId) {
      const active = await this.getActiveMission(userId);
      missionId = active.id;
    }

    await this.prisma.fieldActivityTimelineEvent.create({
      data: {
        userId,
        missionId,
        leadId: dto.visitId,
        eventType: FieldTimelineEventType.VISIT_STARTED,
        title: 'Visit Started',
        description: `Started field visit for target ID ${dto.visitId}`,
        metadata: {
          latitude: dto.latitude,
          longitude: dto.longitude,
          accuracy: dto.accuracy,
        },
      },
    });

    return { visitId: dto.visitId };
  }

  async completeVisit(userId: string, dto: CompleteVisitPayloadDto) {
    const activeMission = await this.getActiveMission(userId);

    // Update business in mission
    const targetBusiness = activeMission.businesses.find(
      (b) => b.id === dto.visitId || b.leadId === dto.visitId,
    );

    const outcomeStatus = dto.visitOutcome || 'VISITED';
    const leadStatus = mapVisitOutcomeToLeadStatus(outcomeStatus);

    // Resolve the linked lead before any writes
    const leadRecord =
      targetBusiness?.leadId || dto.visitId
        ? await this.prisma.lead.findFirst({
            where: {
              id: targetBusiness?.leadId || dto.visitId,
              userId,
              deletedAt: null,
            },
          })
        : null;
    const leadInfo = dto.leadData || {};

    // Evaluate Transition Status (Distance & Time check with last completed visit)
    let transitionStatus: TransitionStatus = TransitionStatus.NORMAL;
    let distanceMeters: number | null = null;
    const durationSeconds: number | null = dto.durationSeconds ?? null;

    const lastEvent = await this.prisma.fieldActivityTimelineEvent.findFirst({
      where: {
        userId,
        eventType: FieldTimelineEventType.VISIT_COMPLETED,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastEvent && lastEvent.metadata && typeof lastEvent.metadata === 'object') {
      const prevMeta = lastEvent.metadata as Record<string, any>;
      if (prevMeta.latitude != null && prevMeta.longitude != null && dto.latitude != null && dto.longitude != null) {
        const distKm = haversineDistance(
          Number(prevMeta.latitude),
          Number(prevMeta.longitude),
          dto.latitude,
          dto.longitude,
        );
        distanceMeters = Math.round(distKm * 1000);

        const timeGapMinutes = Math.round((Date.now() - new Date(lastEvent.createdAt).getTime()) / 60000);

        const unusualDistance = distanceMeters > 5000; // > 5km gap between consecutive field visits
        const unusualTime = timeGapMinutes > 60; // > 60 mins gap

        if (unusualDistance && unusualTime) transitionStatus = TransitionStatus.BOTH_UNUSUAL;
        else if (unusualDistance) transitionStatus = TransitionStatus.UNUSUAL_DISTANCE;
        else if (unusualTime) transitionStatus = TransitionStatus.UNUSUAL_TIME;
      }
    }

    const { transitionRecord, affectedLeadId } = await this.prisma.$transaction(async (tx) => {
      let transitionRecord: VisitTransition | null = null;
      let affectedLeadId: string | null = null;

      if (targetBusiness) {
        await tx.fieldMissionBusiness.update({
          where: { id: targetBusiness.id },
          data: { status: outcomeStatus },
        });
      }

      if (leadRecord) {
        const resolvedStatus = shouldApplyFieldLeadStatus(
          leadRecord.status,
          leadStatus,
        )
          ? leadStatus
          : leadRecord.status;

        affectedLeadId = leadRecord.id;

        await tx.lead.update({
          where: { id: leadRecord.id },
          data: {
            status: resolvedStatus,
            visitedAt: new Date(),
            comments: dto.visitNotes || leadRecord.comments,
            gpsLat: dto.latitude != null ? String(dto.latitude) : leadRecord.gpsLat,
            gpsLng: dto.longitude != null ? String(dto.longitude) : leadRecord.gpsLng,
            phone: leadInfo.phone || leadRecord.phone,
            contactName: leadInfo.contactName || leadRecord.contactName,
            email: leadInfo.email || leadRecord.email,
          },
        });

        // Link the mission business to the lead when the visit came in via a
        // lead id but the business row didn't carry the link.
        if (
          targetBusiness &&
          !targetBusiness.leadId &&
          leadRecord.id !== targetBusiness.id
        ) {
          await tx.fieldMissionBusiness.update({
            where: { id: targetBusiness.id },
            data: { leadId: leadRecord.id },
          });
        }
      } else if (leadInfo.businessName && leadInfo.phone) {
        // Capture a brand new lead during field work when it isn't already in
        // the pipeline. Guard against creating a duplicate when a lead for the
        // same business already exists (matched by phone or business name).
        const existing = await tx.lead.findFirst({
          where: {
            userId,
            deletedAt: null,
            OR: [
              { phone: { contains: leadInfo.phone } },
              {
                businessName: {
                  equals: leadInfo.businessName,
                  mode: "insensitive",
                },
              },
            ],
          },
        });

        const created = existing
          ? existing
          : await tx.lead.create({
              data: {
                userId,
                businessName: leadInfo.businessName,
                industry: leadInfo.category || 'General',
                phone: leadInfo.phone,
                email: leadInfo.email || null,
                contactName: leadInfo.contactName || null,
                source: 'Field Activity',
                status: leadStatus,
                visitedAt: new Date(),
                gpsLat: dto.latitude != null ? String(dto.latitude) : null,
                gpsLng: dto.longitude != null ? String(dto.longitude) : null,
                comments: dto.visitNotes || null,
              },
            });

        affectedLeadId = created.id;

        // Backfill the mission business -> lead link for the new capture
        if (targetBusiness) {
          await tx.fieldMissionBusiness.update({
            where: { id: targetBusiness.id },
            data: { leadId: created.id },
          });
        }
      }

      if (transitionStatus !== TransitionStatus.NORMAL) {
        transitionRecord = await tx.visitTransition.create({
          data: {
            userId,
            leadId: dto.visitId,
            fromLeadId: lastEvent?.leadId || null,
            transitionStatus,
            distanceMeters,
            durationSeconds,
            gpsAccuracy: dto.accuracy != null ? dto.accuracy : null,
          },
        });

        await tx.fieldActivityTimelineEvent.create({
          data: {
            userId,
            missionId: activeMission.id,
            leadId: dto.visitId,
            eventType: FieldTimelineEventType.TRANSITION_UNUSUAL,
            title: 'Unusual Visit Transition Detected',
            description: `Transition flagged: ${transitionStatus}. Distance: ${distanceMeters}m.`,
          },
        });
      }

      // Log completion event
      await tx.fieldActivityTimelineEvent.create({
        data: {
          userId,
          missionId: activeMission.id,
          leadId: dto.visitId,
          eventType: FieldTimelineEventType.VISIT_COMPLETED,
          title: 'Visit Completed',
          description: `Completed visit with outcome: ${outcomeStatus}`,
          metadata: {
            latitude: dto.latitude,
            longitude: dto.longitude,
            accuracy: dto.accuracy,
            durationSeconds: dto.durationSeconds,
          },
        },
      });

      // Log lead capture event when lead data is provided
      if (dto.leadData && dto.leadData.businessName && dto.leadData.phone) {
        await tx.fieldActivityTimelineEvent.create({
          data: {
            userId,
            missionId: activeMission.id,
            leadId: dto.visitId,
            eventType: FieldTimelineEventType.LEAD_CAPTURED,
            title: 'New Lead Captured',
            description: `Captured lead "${dto.leadData.businessName}" during visit.`,
          },
        });
      }

      return { transitionRecord, affectedLeadId };
    });

    // Notify the Communication Engine so journey state + automation rules run
    // for the captured/updated lead (e.g. a new interested lead gets an
    // immediate follow-up task).
    if (affectedLeadId) {
      try {
        await this.engineService.onLeadStatusChanged(affectedLeadId);
      } catch (error) {
        this.logger.error(
          `Communication engine notification failed for lead ${affectedLeadId}`,
          error,
        );
      }
    }

    return {
      visitId: dto.visitId,
      transition: transitionRecord
        ? {
            id: transitionRecord.id,
            status: transitionRecord.transitionStatus,
            distanceMeters: Number(transitionRecord.distanceMeters),
            durationSeconds: transitionRecord.durationSeconds,
          }
        : null,
    };
  }

  async getVisitStatus(userId: string, visitId: string) {
    const activeMission = await this.getActiveMission(userId);
    const progress = await this.getMissionProgress(userId, activeMission.id);

    const business = activeMission.businesses.find((b) => b.id === visitId || b.leadId === visitId) || activeMission.businesses[0];

    const transition = await this.prisma.visitTransition.findFirst({
      where: { userId, leadId: visitId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      visitId,
      business,
      mission: activeMission,
      progress,
      transition: transition
        ? {
            id: transition.id,
            status: transition.transitionStatus,
            distanceMeters: Number(transition.distanceMeters),
            durationSeconds: transition.durationSeconds,
            explanationReason: transition.explanationReason,
            explanationNotes: transition.explanationNotes,
          }
        : null,
    };
  }

  async submitTransitionExplanation(userId: string, visitId: string, dto: TransitionExplanationDto) {
    const transition = await this.prisma.visitTransition.findFirst({
      where: { userId, leadId: visitId },
      orderBy: { createdAt: 'desc' },
    });

    if (transition) {
      await this.prisma.visitTransition.update({
        where: { id: transition.id },
        data: {
          explanationReason: dto.reason,
          explanationNotes: dto.notes || null,
        },
      });
    } else {
      await this.prisma.visitTransition.create({
        data: {
          userId,
          leadId: visitId,
          transitionStatus: TransitionStatus.UNUSUAL_DISTANCE,
          explanationReason: dto.reason,
          explanationNotes: dto.notes || null,
        },
      });
    }

    return { success: true };
  }
}
