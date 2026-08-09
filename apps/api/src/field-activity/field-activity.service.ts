import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartVisitPayloadDto, CompleteVisitPayloadDto, TransitionExplanationDto } from './dto/field-activity.dto';
import { FieldTimelineEventType, TransitionStatus } from '@prisma/client';
import { haversineDistance } from '../performance/lead-quality.util';

@Injectable()
export class FieldActivityService {
  constructor(private prisma: PrismaService) {}

  async getActiveMission(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    if (!mission) {
      // Find user's market mapping visits or create default mission
      const visits = await this.prisma.marketMappingVisit.findMany({
        where: { userId },
        take: 15,
        orderBy: { createdAt: 'desc' },
      });

      const businessesData: Array<{
        visitId?: string;
        name: string;
        category: string;
        address?: string;
        gpsAddress?: string;
        isAnchor: boolean;
        isPlaceholder: boolean;
        status: string;
        dailyCustomers?: string;
        businessSize?: string;
      }> = visits.map((v) => ({
        visitId: v.id,
        name: v.name,
        category: v.category || 'General',
        address: v.address || v.exactAddress || 'Location',
        gpsAddress: v.gpsAddress || undefined,
        isAnchor: v.isAnchor,
        isPlaceholder: false,
        status: v.status || 'NOT_YET',
        dailyCustomers: v.dailyCustomers || 'MEDIUM',
        businessSize: v.businessSize || 'MEDIUM',
      }));

      // Add placeholders up to 20 if needed
      const placeholderCount = Math.max(0, 20 - businessesData.length);
      for (let i = 1; i <= placeholderCount; i++) {
        businessesData.push({
          name: `Placeholder ${businessesData.length + 1}`,
          category: 'Unknown',
          address: 'Assigned Territory',
          isAnchor: false,
          isPlaceholder: true,
          status: 'NOT_YET',
        });
      }

      mission = await this.prisma.fieldMission.create({
        data: {
          userId,
          name: `Daily Mission - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          location: 'Assigned Territory',
          targetCount: 20,
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
        visitId: b.visitId,
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
        visitId: dto.visitId,
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
      (b) => b.id === dto.visitId || b.visitId === dto.visitId,
    );

    const outcomeStatus = dto.visitOutcome || 'VISITED';

    if (targetBusiness) {
      await this.prisma.fieldMissionBusiness.update({
        where: { id: targetBusiness.id },
        data: { status: outcomeStatus },
      });
    }

    if (targetBusiness?.visitId || dto.visitId) {
      const visitRecord = await this.prisma.marketMappingVisit.findFirst({
        where: { id: targetBusiness?.visitId || dto.visitId, userId },
      });
      if (visitRecord) {
        await this.prisma.marketMappingVisit.update({
          where: { id: visitRecord.id },
          data: {
            status: outcomeStatus,
            visitedAt: new Date(),
            visitNotes: dto.visitNotes || visitRecord.visitNotes,
            gpsLat: dto.latitude != null ? String(dto.latitude) : visitRecord.gpsLat,
            gpsLng: dto.longitude != null ? String(dto.longitude) : visitRecord.gpsLng,
          },
        });
      }
    }

    // Evaluate Transition Status (Distance & Time check with last completed visit)
    let transitionStatus: TransitionStatus = TransitionStatus.NORMAL;
    let distanceMeters: number | null = null;
    let durationSeconds: number | null = dto.durationSeconds ?? null;

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

    let transitionRecord = null;
    if (transitionStatus !== TransitionStatus.NORMAL) {
      transitionRecord = await this.prisma.visitTransition.create({
        data: {
          userId,
          visitId: dto.visitId,
          fromVisitId: lastEvent?.visitId || null,
          transitionStatus,
          distanceMeters,
          durationSeconds,
          gpsAccuracy: dto.accuracy != null ? dto.accuracy : null,
        },
      });

      await this.prisma.fieldActivityTimelineEvent.create({
        data: {
          userId,
          missionId: activeMission.id,
          visitId: dto.visitId,
          eventType: FieldTimelineEventType.TRANSITION_UNUSUAL,
          title: 'Unusual Visit Transition Detected',
          description: `Transition flagged: ${transitionStatus}. Distance: ${distanceMeters}m.`,
        },
      });
    }

    // Log completion event
    await this.prisma.fieldActivityTimelineEvent.create({
      data: {
        userId,
        missionId: activeMission.id,
        visitId: dto.visitId,
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

    // Create lead if leadData is provided
    if (dto.leadData && dto.leadData.businessName && dto.leadData.phone) {
      await this.prisma.lead.create({
        data: {
          affiliateId: userId,
          businessName: dto.leadData.businessName,
          industry: dto.leadData.category || 'General',
          contactName: dto.leadData.contactName || null,
          phone: dto.leadData.phone,
          email: dto.leadData.email || null,
          source: 'Field Activity',
          status: outcomeStatus === 'CUSTOMER' ? 'COMPLETED' : 'INTERESTED',
        },
      });

      await this.prisma.fieldActivityTimelineEvent.create({
        data: {
          userId,
          missionId: activeMission.id,
          visitId: dto.visitId,
          eventType: FieldTimelineEventType.LEAD_CAPTURED,
          title: 'New Lead Captured',
          description: `Captured lead "${dto.leadData.businessName}" during visit.`,
        },
      });
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

    const business = activeMission.businesses.find((b) => b.id === visitId || b.visitId === visitId) || activeMission.businesses[0];

    const transition = await this.prisma.visitTransition.findFirst({
      where: { userId, visitId },
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
      where: { userId, visitId },
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
          visitId,
          transitionStatus: TransitionStatus.UNUSUAL_DISTANCE,
          explanationReason: dto.reason,
          explanationNotes: dto.notes || null,
        },
      });
    }

    return { success: true };
  }
}
