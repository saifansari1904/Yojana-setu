/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ApplicationRecord,
  BusinessStage,
  DashboardInsights,
  FollowUpItem,
  OpportunityItem,
  Phase3MatchResult,
  Scheme,
  SupportCategory,
  UserDocumentState,
  UserProfile,
} from '../../types';
import { calculateProfileCompleteness, getBusinessJourneyStage, JOURNEY_STAGES } from '../business/businessIntelligence';
import { buildOpportunityItem } from '../application/applicationPriority';
import { calculateDocumentReadiness } from '../documents/documentReadiness';
import { getSupportStackCounts } from '../support/supportPathway';
import { aggregateApplications } from '../application/applicationTracker';

export interface DashboardCompositionParams {
  profile: UserProfile | null;
  schemes: Scheme[];
  applicationRecords: ApplicationRecord[];
  userDocs: Record<string, UserDocumentState>;
  savedSchemeIds: string[];
  followUps: FollowUpItem[];
  /**
   * Match results produced by the app's authoritative matching engine
   * (Social 30 / Business Type 25 / Income 20 / Age 15 / State 10).
   * The Command Center never recomputes matching — it only composes.
   */
  matchResults: Phase3MatchResult[];
}

/**
 * Composes existing domain engines into unified Command Center insights.
 * Strict rule: Composes existing engines without re-implementing matching or business rules.
 */
export function generateDashboardInsights(params: DashboardCompositionParams): DashboardInsights {
  const {
    profile,
    schemes,
    applicationRecords,
    userDocs,
    savedSchemeIds,
    followUps,
  } = params;

  const hasProfile = Boolean(profile && (profile.businessName || profile.state || profile.businessType));

  if (!hasProfile || !profile) {
    // Clean Empty State for New Users - NEVER output fake metrics
    return {
      currentBusinessStage: 'IDEA',
      businessStageName: 'Idea',
      businessStageNameHi: 'विचार (Idea)',
      profileCompleteness: {
        percentage: 0,
        missingFields: ['Business Name', 'Business Type', 'State', 'Age', 'Income'],
        missingFieldsHi: ['व्यवसाय का नाम', 'व्यवसाय का प्रकार', 'राज्य', 'आयु', 'आय'],
        isComplete: false,
      },
      topOpportunity: null,
      priorityOpportunities: [],
      allOpportunities: [],
      nextBestAction: {
        title: 'Build My Business Profile',
        titleHi: 'अपनी व्यावसायिक प्रोफ़ाइल बनाएं',
        description: 'Tell us about your business to unlock personalized scheme recommendations and statutory subsidies.',
        descriptionHi: 'व्यक्तिगत योजना अनुशंसाओं और वैधानिक सब्सिडी को अनलॉक करने के लिए अपने व्यवसाय के बारे में बताएं।',
        actionLabel: 'Build My Business Profile',
        actionLabelHi: 'व्यावसायिक प्रोफ़ाइल बनाएं',
        targetWorkspace: 'PROFILE',
      },
      applicationSummary: {
        total: 0,
        readyToApply: 0,
        preparing: 0,
        applied: 0,
        approved: 0,
        records: [],
      },
      documentSummary: {
        prepared: 0,
        needPreparation: 0,
        unknown: 0,
        reusable: [],
        applicationSpecific: [],
      },
      supportSummary: {
        categoryCounts: {
          'Funding': 0,
          'Registration': 0,
          'Skill Development': 0,
          'Infrastructure': 0,
          'Market Access': 0,
        },
        currentStagePathways: {
          stage: 'IDEA',
          schemesCount: 0,
          pathwaysCount: 0,
          applicationsUnderwayCount: 0,
        },
      },
      followUpSummary: {
        upcoming: [],
        totalCount: 0,
      },
      trustSummary: {
        visibleSchemesCount: 0,
        recentlyVerifiedCount: 0,
        recentlyVerifiedPercentage: 0,
        officialSourcesCount: 0,
        needsVerificationCount: 0,
        nodalSourcesCount: 0,
      },
      hasProfile: false,
      hasMatches: false,
    };
  }

  // 1. Business Journey & Completeness
  const completeness = calculateProfileCompleteness(profile);
  const currentBusinessStage = getBusinessJourneyStage(profile);
  const stageInfo = JOURNEY_STAGES.find(s => s.stage === currentBusinessStage) || JOURNEY_STAGES[0];

  // 2. Authoritative Matching (supplied by the app's matching engine)
  const matchResults = params.matchResults;

  // 3. Action Priority & Opportunity Lifecycle Mapping
  const appRecordMap = new Map<string, ApplicationRecord>();
  applicationRecords.forEach(r => appRecordMap.set(r.schemeId, r));

  const opportunities: OpportunityItem[] = matchResults.map(mr => {
    const scheme = schemes.find(s => s.id === mr.schemeId)!;
    const appRecord = appRecordMap.get(scheme.id);
    const isSaved = savedSchemeIds.includes(scheme.id);
    return buildOpportunityItem(scheme, mr, appRecord, isSaved, userDocs, profile);
  });

  // Filter eligible or potential schemes
  const eligibleOpportunities = opportunities.filter(o => !o.matchResult.hasBlocker);
  const hasMatches = eligibleOpportunities.length > 0;

  // Sort by Action Priority first (ACTION_NOW > HIGH_PRIORITY > REVIEW > INFORMATION_NEEDED > LOW_PRIORITY),
  // then by match score descending
  const priorityOrder = {
    'ACTION_NOW': 1,
    'HIGH_PRIORITY': 2,
    'INFORMATION_NEEDED': 3,
    'REVIEW': 4,
    'LOW_PRIORITY': 5,
  };

  const sortedOpportunities = [...opportunities].sort((a, b) => {
    const pDiff = priorityOrder[a.actionPriority] - priorityOrder[b.actionPriority];
    if (pDiff !== 0) return pDiff;
    return b.matchResult.totalMatchScore - a.matchResult.totalMatchScore;
  });

  const topOpportunity = sortedOpportunities.length > 0 && !sortedOpportunities[0].matchResult.hasBlocker
    ? sortedOpportunities[0]
    : null;

  const priorityOpportunities = sortedOpportunities.slice(0, 3);

  // 4. Applications Aggregation
  const appAgg = aggregateApplications(applicationRecords);
  const appRecordsWithScheme = applicationRecords.map(r => ({
    scheme: schemes.find(s => s.id === r.schemeId) || schemes[0],
    record: r,
  }));

  // 5. Document Center Aggregation
  const docSummary = calculateDocumentReadiness(
    schemes.filter(s => eligibleOpportunities.some(o => o.scheme.id === s.id)),
    userDocs
  );

  // 6. Support Stack Aggregation
  const supportCounts = getSupportStackCounts(
    schemes.filter(s => eligibleOpportunities.some(o => o.scheme.id === s.id))
  );

  // 7. Follow-ups
  const upcomingFollowUps = followUps
    .filter(f => !f.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 8. Trust Metrics (strictly real values from visible schemes)
  const visibleSchemes = schemes.filter(s => eligibleOpportunities.some(o => o.scheme.id === s.id));
  const recentlyVerifiedCount = visibleSchemes.filter(s => s.freshnessStatus === 'FRESH' || s.freshnessStatus === 'RECENTLY_VERIFIED').length;
  const officialSourcesCount = visibleSchemes.filter(s => s.portalDomainClass === 'VERIFIED_OFFICIAL').length;
  const nodalSourcesCount = visibleSchemes.filter(s => s.portalDomainClass === 'KNOWN_NODAL').length;
  const needsVerificationCount = visibleSchemes.filter(s => s.freshnessStatus === 'NEEDS_VERIFICATION').length;
  const recentlyVerifiedPercentage = visibleSchemes.length > 0
    ? Math.round((recentlyVerifiedCount / visibleSchemes.length) * 100)
    : 100;

  // 9. Overall Command Center Next Best Action
  let nextBestAction: DashboardInsights['nextBestAction'] = null;

  if (!completeness.isComplete && completeness.missingFields.length > 0 && completeness.percentage < 60) {
    nextBestAction = {
      title: 'Complete your business profile',
      titleHi: 'अपनी व्यावसायिक प्रोफ़ाइल पूरी करें',
      description: `${completeness.missingFields.slice(0, 2).join(', ')} missing. Completing your profile improves recommendation precision.`,
      descriptionHi: `${completeness.missingFieldsHi.slice(0, 2).join(', ')} की जानकारी जोड़ें। इससे सटीक योजनाएं प्राप्त होंगी।`,
      actionLabel: 'Complete Profile',
      actionLabelHi: 'प्रोफ़ाइल पूरा करें',
      targetWorkspace: 'PROFILE',
    };
  } else if (topOpportunity) {
    nextBestAction = {
      title: topOpportunity.nextBestAction.actionText,
      titleHi: topOpportunity.nextBestAction.actionTextHi,
      description: topOpportunity.nextBestAction.reasonText,
      descriptionHi: topOpportunity.nextBestAction.reasonTextHi,
      actionLabel: 'Continue →',
      actionLabelHi: 'आगे बढ़ें →',
      schemeId: topOpportunity.scheme.id,
      targetWorkspace: topOpportunity.nextBestAction.targetWorkspace,
    };
  }

  return {
    currentBusinessStage,
    businessStageName: stageInfo.title,
    businessStageNameHi: stageInfo.titleHi,
    profileCompleteness: completeness,
    topOpportunity,
    priorityOpportunities,
    allOpportunities: sortedOpportunities,
    nextBestAction,
    applicationSummary: {
      total: appAgg.total,
      readyToApply: appAgg.readyToApply,
      preparing: appAgg.preparing,
      applied: appAgg.applied,
      approved: appAgg.approved,
      records: appRecordsWithScheme,
    },
    documentSummary: {
      prepared: docSummary.prepared,
      needPreparation: docSummary.needPreparation,
      unknown: docSummary.unknown,
      reusable: docSummary.reusable,
      applicationSpecific: docSummary.applicationSpecific,
    },
    supportSummary: {
      categoryCounts: supportCounts,
      currentStagePathways: {
        stage: currentBusinessStage,
        schemesCount: eligibleOpportunities.length,
        pathwaysCount: Object.values(supportCounts).filter(c => c > 0).length,
        applicationsUnderwayCount: appAgg.preparing + appAgg.readyToApply,
      },
    },
    followUpSummary: {
      upcoming: upcomingFollowUps,
      totalCount: upcomingFollowUps.length,
    },
    trustSummary: {
      visibleSchemesCount: visibleSchemes.length,
      recentlyVerifiedCount,
      recentlyVerifiedPercentage,
      officialSourcesCount,
      needsVerificationCount,
      nodalSourcesCount,
    },
    hasProfile: true,
    hasMatches,
  };
}
