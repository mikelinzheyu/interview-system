/**
 * Recommendation Service - AI-powered domain suggestions
 *
 * Features:
 * - User profile building based on interests, goals, learning style
 * - Content-based filtering (domain attributes matching)
 * - Collaborative filtering simulation (find similar users)
 * - Recommendation ranking algorithm with confidence scores
 * - Real-time suggestion generation
 *
 * @module recommendationService
 */

/**
 * User Profile Interface
 * @typedef {Object} UserProfile
 * @property {string} userId - Unique user identifier
 * @property {string[]} interests - User's domain interests (e.g., 'AI', 'Web Development')
 * @property {string[]} goals - Career/learning goals
 * @property {string} learningStyle - 'theoretical' | 'practical' | 'balanced'
 * @property {string} timePerWeek - '1-3h' | '5-10h' | '15+h'
 * @property {string[]} completedDomains - IDs of completed domains
 * @property {string[]} inProgressDomains - IDs of domains user is learning
 * @property {number[]} likedDomainIds - IDs of liked domains
 * @property {Date} registeredAt - User registration date
 */

/**
 * Domain Attributes
 * @typedef {Object} DomainAttribute
 * @property {number} id - Domain ID
 * @property {string} name - Domain name
 * @property {string[]} tags - Domain tags (e.g., 'programming', 'web', 'frontend')
 * @property {string} discipline - Parent discipline
 * @property {string} difficulty - 'beginner' | 'intermediate' | 'advanced'
 * @property {number} timeRequired - Estimated hours to master
 * @property {number} popularity - 0-100 popularity score
 * @property {number} rating - 0-5 rating
 * @property {number} questionCount - Number of practice questions
 * @property {string[]} prerequisites - IDs of prerequisite domains
 * @property {string[]} relatedDomains - IDs of related/complementary domains
 * @property {Date} createdAt - Domain creation date
 * @property {Date} lastUpdatedAt - Last update date
 * @property {string[]} careerPaths - Associated career paths
 */

/**
 * Recommendation Result
 * @typedef {Object} RecommendationResult
 * @property {number} domainId - Recommended domain ID
 * @property {string} domainName - Recommended domain name
 * @property {number} score - Recommendation score (0-100)
 * @property {string} reason - Human-readable reason
 * @property {string[]} matchedAttributes - Which attributes matched
 * @property {number} contentSimilarity - Content-based score
 * @property {number} collaborativeSimilarity - Collaborative score
 * @property {number} trendingScore - Trending/popularity score
 * @property {boolean} isPrerequisite - Whether it's a prerequisite
 * @property {boolean} isComplementary - Whether it's complementary to user's interests
 */

// Sample domain data structure for reference
const SAMPLE_DOMAINS = [
  {
    id: 1,
    name: 'JavaScript Fundamentals',
    tags: ['programming', 'javascript', 'web', 'frontend', 'beginner'],
    discipline: 'Computer Science',
    difficulty: 'beginner',
    timeRequired: 40,
    popularity: 95,
    rating: 4.8,
    questionCount: 156,
    prerequisites: [],
    relatedDomains: [2, 3, 5],
    careerPaths: ['Frontend Developer', 'Full Stack Developer', 'Web Developer'],
  },
  {
    id: 2,
    name: 'React.js Advanced Patterns',
    tags: ['javascript', 'react', 'frontend', 'advanced', 'web'],
    discipline: 'Computer Science',
    difficulty: 'advanced',
    timeRequired: 60,
    popularity: 88,
    rating: 4.7,
    questionCount: 124,
    prerequisites: [1, 3],
    relatedDomains: [1, 5, 8],
    careerPaths: ['Frontend Developer', 'Full Stack Developer'],
  },
  {
    id: 3,
    name: 'CSS & Responsive Design',
    tags: ['css', 'design', 'frontend', 'responsive', 'web'],
    discipline: 'Computer Science',
    difficulty: 'intermediate',
    timeRequired: 30,
    popularity: 85,
    rating: 4.6,
    questionCount: 98,
    prerequisites: [],
    relatedDomains: [1, 2, 5],
    careerPaths: ['Frontend Developer', 'UI/UX Developer'],
  },
];

/**
 * Recommendation Algorithm Service
 */
const recommendationService = {
  /**
   * Build a comprehensive user profile from raw user data
   * @param {Object} userData - Raw user data
   * @returns {UserProfile} Comprehensive user profile
   */
  buildUserProfile(userData) {
    const {
      userId,
      interests = [],
      goals = [],
      learningStyle = 'balanced',
      timePerWeek = '5-10h',
      completedDomains = [],
      inProgressDomains = [],
      likedDomainIds = [],
    } = userData;

    return {
      userId,
      interests: Array.isArray(interests) ? interests : [],
      goals: Array.isArray(goals) ? goals : [],
      learningStyle,
      timePerWeek,
      completedDomains: Array.isArray(completedDomains) ? completedDomains : [],
      inProgressDomains: Array.isArray(inProgressDomains) ? inProgressDomains : [],
      likedDomainIds: Array.isArray(likedDomainIds) ? likedDomainIds : [],
      registeredAt: userData.registeredAt || new Date(),
    };
  },

  /**
   * Generate personalized recommendations using multiple algorithms
   * @param {UserProfile} userProfile - User profile
   * @param {DomainAttribute[]} allDomains - All available domains
   * @param {number} count - Number of recommendations to return
   * @returns {RecommendationResult[]} Ranked recommendations
   */
  generateRecommendations(userProfile, allDomains, count = 5) {
    // Filter out already completed domains
    const candidates = allDomains.filter(
      d => !userProfile.completedDomains.includes(d.id)
    );

    if (candidates.length === 0) {
      return [];
    }

    // Score each candidate using multiple algorithms
    const scored = candidates.map(domain => {
      const contentScore = this._contentBasedScore(domain, userProfile);
      const collaborativeScore = this._collaborativeScore(domain, userProfile, allDomains);
      const trendingScore = this._trendingScore(domain);
      const prerequisiteBonus = this._prerequisiteBonus(domain, userProfile, allDomains);

      // Weighted combination
      const finalScore = Math.round(
        contentScore * 0.45 +
        collaborativeScore * 0.25 +
        trendingScore * 0.15 +
        prerequisiteBonus * 0.15
      );

      return {
        domainId: domain.id,
        domainName: domain.name,
        score: Math.min(100, Math.max(0, finalScore)),
        reason: this._generateReason(domain, userProfile, contentScore, collaborativeScore),
        matchedAttributes: this._getMatchedAttributes(domain, userProfile),
        contentSimilarity: contentScore,
        collaborativeSimilarity: collaborativeScore,
        trendingScore,
        isPrerequisite: this._isPrerequisiteFor(domain, userProfile, allDomains),
        isComplementary: this._isComplementary(domain, userProfile),
      };
    });

    // Sort by score and return top N
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  },

  /**
   * Content-based filtering score
   * Match domain attributes with user interests/goals
   * @private
   * @returns {number} Score 0-100
   */
  _contentBasedScore(domain, userProfile) {
    let score = 0;
    let matchCount = 0;

    // Match tags with interests
    const tagMatches = domain.tags.filter(tag =>
      userProfile.interests.some(interest =>
        tag.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(tag.toLowerCase())
      )
    );
    score += tagMatches.length * 15;
    matchCount += tagMatches.length;

    // Match career paths with goals
    const goalMatches = domain.careerPaths?.filter(path =>
      userProfile.goals.some(goal =>
        path.toLowerCase().includes(goal.toLowerCase()) ||
        goal.toLowerCase().includes(path.toLowerCase())
      )
    ) || [];
    score += goalMatches.length * 20;
    matchCount += goalMatches.length;

    // Difficulty level matching
    if (userProfile.learningStyle === 'theoretical') {
      // Prefer more advanced/complex domains
      if (domain.difficulty === 'advanced') score += 15;
      if (domain.difficulty === 'intermediate') score += 10;
    } else if (userProfile.learningStyle === 'practical') {
      // Prefer domains with more questions
      score += Math.min(20, (domain.questionCount / 200) * 20);
    } else {
      // Balanced - slight preference for intermediate
      if (domain.difficulty === 'intermediate') score += 10;
    }

    // Time investment matching
    const timeBonus = this._getTimeInvestmentBonus(domain, userProfile);
    score += timeBonus;

    // Normalize: max possible is around 100
    return Math.min(100, score);
  },

  /**
   * Collaborative filtering simulation
   * Find similar domains to ones user already likes
   * @private
   * @returns {number} Score 0-100
   */
  _collaborativeScore(domain, userProfile, allDomains) {
    if (userProfile.likedDomainIds.length === 0) {
      return 0;
    }

    let similaritySum = 0;

    // For each liked domain, calculate similarity to current domain
    userProfile.likedDomainIds.forEach(likedId => {
      const likedDomain = allDomains.find(d => d.id === likedId);
      if (!likedDomain) return;

      // Tag overlap
      const commonTags = domain.tags.filter(tag =>
        likedDomain.tags.includes(tag)
      ).length;
      const tagSimilarity = (commonTags / Math.max(domain.tags.length, 1)) * 30;

      // Discipline match
      const disciplineSimilarity = domain.discipline === likedDomain.discipline ? 20 : 0;

      // Related domains bonus
      const isRelated = likedDomain.relatedDomains?.includes(domain.id) ? 30 : 0;

      similaritySum += tagSimilarity + disciplineSimilarity + isRelated;
    });

    // Average similarity across liked domains
    const collaborativeScore = similaritySum / userProfile.likedDomainIds.length;
    return Math.min(100, collaborativeScore);
  },

  /**
   * Trending and popularity score
   * @private
   * @returns {number} Score 0-100
   */
  _trendingScore(domain) {
    // Combine popularity and rating
    const popularityScore = domain.popularity || 0;
    const ratingScore = (domain.rating || 0) * 20; // 0-5 → 0-100
    const questionCountScore = Math.min(50, (domain.questionCount / 300) * 50);

    return (popularityScore * 0.5 + ratingScore * 0.3 + questionCountScore * 0.2);
  },

  /**
   * Prerequisite bonus
   * Check if domain is a prerequisite for user's goals
   * @private
   * @returns {number} Score 0-100
   */
  _prerequisiteBonus(domain, userProfile, allDomains) {
    // Check if any in-progress domains have this as prerequisite
    const isPrereqForInProgress = userProfile.inProgressDomains.some(inProgId => {
      const inProgDomain = allDomains.find(d => d.id === inProgId);
      return inProgDomain?.prerequisites?.includes(domain.id);
    });

    if (isPrereqForInProgress) {
      return 100; // High priority if prerequisite for current learning
    }

    // Check if it's helpful for goals
    const goalMatch = userProfile.goals.some(goal =>
      domain.careerPaths?.some(path =>
        path.toLowerCase().includes(goal.toLowerCase())
      )
    );

    return goalMatch ? 60 : 0;
  },

  /**
   * Time investment bonus
   * Match domain's time requirement with user's available time
   * @private
   * @returns {number} Bonus points 0-30
   */
  _getTimeInvestmentBonus(domain, userProfile) {
    const timeMap = {
      '1-3h': { min: 1, max: 3 },
      '5-10h': { min: 5, max: 10 },
      '15+h': { min: 15, max: 999 },
    };

    const userTimeRange = timeMap[userProfile.timePerWeek];
    if (!userTimeRange) return 0;

    // Estimate domain completion time per week (assuming 5 hours per week default)
    const domainHoursPerWeek = Math.min(userTimeRange.max, Math.max(userTimeRange.min, 5));
    const weeksToComplete = domain.timeRequired / domainHoursPerWeek;

    // Prefer domains completable in 4-12 weeks
    if (weeksToComplete >= 4 && weeksToComplete <= 12) {
      return 30;
    } else if (weeksToComplete >= 2 && weeksToComplete <= 20) {
      return 20;
    } else {
      return 10;
    }
  },

  /**
   * Generate human-readable recommendation reason
   * @private
   * @returns {string} Explanation of recommendation
   */
  _generateReason(domain, userProfile, contentScore, collaborativeScore) {
    const reasons = [];

    // Add reasons based on what matched
    if (userProfile.interests.length > 0) {
      const matchingInterests = userProfile.interests.filter(interest =>
        domain.tags?.some(tag =>
          tag.toLowerCase().includes(interest.toLowerCase())
        )
      );
      if (matchingInterests.length > 0) {
        reasons.push(`matches your interests in ${matchingInterests.join(', ')}`);
      }
    }

    if (userProfile.goals.length > 0) {
      const matchingGoals = userProfile.goals.filter(goal =>
        domain.careerPaths?.some(path =>
          path.toLowerCase().includes(goal.toLowerCase())
        )
      );
      if (matchingGoals.length > 0) {
        reasons.push(`supports your goal of ${matchingGoals[0]}`);
      }
    }

    if (collaborativeScore > 50) {
      reasons.push('similar to domains you liked');
    }

    if (domain.popularity >= 80) {
      reasons.push('trending and highly rated');
    }

    if (reasons.length === 0) {
      reasons.push('comprehensive learning path');
    }

    return reasons.join(' • ');
  },

  /**
   * Get attributes that matched with user profile
   * @private
   * @returns {string[]} List of matched attributes
   */
  _getMatchedAttributes(domain, userProfile) {
    const matched = [];

    if (userProfile.interests.length > 0) {
      const interestMatch = domain.tags?.some(tag =>
        userProfile.interests.some(interest =>
          tag.toLowerCase().includes(interest.toLowerCase())
        )
      );
      if (interestMatch) matched.push('Interest Match');
    }

    if (userProfile.goals.length > 0) {
      const goalMatch = domain.careerPaths?.some(path =>
        userProfile.goals.some(goal =>
          path.toLowerCase().includes(goal.toLowerCase())
        )
      );
      if (goalMatch) matched.push('Career Goal');
    }

    if (domain.popularity >= 80) {
      matched.push('Popular');
    }

    if (domain.rating >= 4.5) {
      matched.push('Highly Rated');
    }

    return matched;
  },

  /**
   * Check if domain is a prerequisite for user's in-progress learning
   * @private
   */
  _isPrerequisiteFor(domain, userProfile, allDomains) {
    return userProfile.inProgressDomains.some(inProgId => {
      const inProgDomain = allDomains.find(d => d.id === inProgId);
      return inProgDomain?.prerequisites?.includes(domain.id);
    });
  },

  /**
   * Check if domain is complementary to user's interests
   * @private
   */
  _isComplementary(domain, userProfile) {
    return domain.relatedDomains && domain.relatedDomains.length > 0 &&
      userProfile.likedDomainIds.some(likedId =>
        domain.relatedDomains.includes(likedId)
      );
  },

  /**
   * Get similar domains to a given domain
   * Useful for "recommended together" or "next steps" features
   * @param {number} domainId - Domain to find similar domains for
   * @param {DomainAttribute[]} allDomains - All available domains
   * @param {number} count - Number of similar domains to return
   * @returns {Array} Similar domains with similarity scores
   */
  getSimilarDomains(domainId, allDomains, count = 5) {
    const domain = allDomains.find(d => d.id === domainId);
    if (!domain) return [];

    const similar = allDomains
      .filter(d => d.id !== domainId)
      .map(d => {
        // Tag overlap similarity
        const commonTags = d.tags.filter(tag => domain.tags.includes(tag)).length;
        const tagSimilarity = (commonTags / Math.max(domain.tags.length, d.tags.length)) * 50;

        // Discipline match
        const disciplineSimilarity = d.discipline === domain.discipline ? 30 : 0;

        // Related domains bonus
        const directRelation = domain.relatedDomains?.includes(d.id) ? 20 : 0;

        const totalScore = tagSimilarity + disciplineSimilarity + directRelation;

        return {
          ...d,
          similarityScore: Math.round(totalScore),
        };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, count);

    return similar;
  },

  /**
   * Get trending/popular domains
   * @param {DomainAttribute[]} allDomains - All available domains
   * @param {number} count - Number to return
   * @returns {DomainAttribute[]} Top trending domains
   */
  getPopularDomains(allDomains, count = 5) {
    return [...allDomains]
      .sort((a, b) => {
        // Combine popularity and rating
        const scoreA = (a.popularity || 0) * 0.7 + (a.rating || 0) * 20 * 0.3;
        const scoreB = (b.popularity || 0) * 0.7 + (b.rating || 0) * 20 * 0.3;
        return scoreB - scoreA;
      })
      .slice(0, count);
  },

  /**
   * Get domains by difficulty level
   * @param {DomainAttribute[]} allDomains - All available domains
   * @param {string} difficulty - 'beginner' | 'intermediate' | 'advanced'
   * @returns {DomainAttribute[]} Filtered domains
   */
  getDomainsByDifficulty(allDomains, difficulty) {
    return allDomains.filter(d => d.difficulty === difficulty);
  },

  /**
   * Get prerequisites for a domain
   * @param {number} domainId - Domain ID
   * @param {DomainAttribute[]} allDomains - All available domains
   * @returns {DomainAttribute[]} Required prerequisites
   */
  getPrerequisites(domainId, allDomains) {
    const domain = allDomains.find(d => d.id === domainId);
    if (!domain || !domain.prerequisites) return [];

    return domain.prerequisites
      .map(preqId => allDomains.find(d => d.id === preqId))
      .filter(d => d !== undefined);
  },

  /**
   * Get recommended learning path
   * Sequence of domains from beginner to advanced for a given interest
   * @param {string} interest - User's main interest/goal
   * @param {DomainAttribute[]} allDomains - All available domains
   * @returns {DomainAttribute[]} Ordered learning path
   */
  getLearningPath(interest, allDomains) {
    // Find domains matching the interest
    const matchingDomains = allDomains.filter(d =>
      d.tags?.some(tag =>
        tag.toLowerCase().includes(interest.toLowerCase())
      ) ||
      d.careerPaths?.some(path =>
        path.toLowerCase().includes(interest.toLowerCase())
      )
    );

    // Sort by difficulty level
    const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
    return matchingDomains.sort((a, b) =>
      (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0)
    );
  },

  /**
   * Calculate recommendation confidence
   * How confident the algorithm is in its recommendation
   * @private
   * @returns {number} Confidence 0-100
   */
  calculateConfidence(recommendation, userProfile) {
    let confidence = 0;

    // More profile data = higher confidence
    confidence += Math.min(25, userProfile.likedDomainIds.length * 5);

    // Multiple matching attributes = higher confidence
    confidence += Math.min(25, recommendation.matchedAttributes.length * 10);

    // Higher scores = higher confidence
    confidence += Math.min(25, (recommendation.score / 100) * 25);

    // Consistency across algorithms
    const avgScore = (
      recommendation.contentSimilarity +
      recommendation.collaborativeSimilarity +
      recommendation.trendingScore
    ) / 3;
    const consistency = 100 - Math.abs(recommendation.score - avgScore);
    confidence += consistency * 0.25;

    return Math.round(Math.min(100, confidence));
  },
};

export default recommendationService;
