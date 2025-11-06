/**
 * 推荐算法核心模块
 * 基于用户特征（学科兴趣、能力、职业目标）推荐最适合的专业
 */

// 学科分类映射
const DISCIPLINE_MAPPING = {
  philosophy: '01',      // 哲学
  economics: '02',       // 经济学
  law: '03',            // 法学
  education: '04',      // 教育学
  literature: '05',     // 文学
  history: '06',        // 历史学
  science: '07',        // 理学
  engineering: '08',    // 工学
  agriculture: '09',    // 农学
  medicine: '10',       // 医学
  military: '11',       // 军事学
  management: '12',     // 管理学
  art: '13'             // 艺术学
};

// 能力-专业映射关系
const ABILITY_MAJOR_MAPPING = {
  analytical: {         // 分析能力
    majors: ['080901', '020301', '070101', '120102'],
    weight: 0.25
  },
  creative: {          // 创意能力
    majors: ['130502', '050301', '130301', '130401'],
    weight: 0.20
  },
  communication: {     // 沟通能力
    majors: ['050201', '120202', '030201', '120401'],
    weight: 0.20
  },
  practical: {         // 实践能力
    majors: ['090101', '080201', '081301', '101101'],
    weight: 0.20
  },
  learning: {          // 学习能力
    majors: ['010101', '040101', '100201', '070201'],
    weight: 0.15
  }
};

// 职业目标-专业映射关系
const CAREER_GOAL_MAJOR_MAPPING = {
  highSalary: {        // 高薪工作
    majors: ['080901', '020301', '120202', '100201'],
    weight: 0.30
  },
  techExpert: {        // 技术专家
    majors: ['080901', '080702', '070201', '081301'],
    weight: 0.35
  },
  management: {        // 管理位置
    majors: ['120201', '120202', '120402', '030201'],
    weight: 0.25
  },
  entrepreneurship: {  // 创业
    majors: ['020301', '120201', '080901', '130502'],
    weight: 0.25
  },
  socialContribution: {// 社会贡献
    majors: ['100201', '030301', '090101', '120401'],
    weight: 0.20
  }
};

/**
 * 用户兴趣评估类
 */
class UserProfile {
  constructor(userInput) {
    this.userId = userInput.userId || null;
    this.disciplines = userInput.disciplines || {};
    this.abilities = userInput.abilities || {};
    this.careerGoals = userInput.careerGoals || {};
    this.preferences = userInput.preferences || {};
    this.timestamp = new Date();
  }

  /**
   * 验证用户数据完整性
   */
  validate() {
    if (Object.keys(this.disciplines).length === 0) {
      throw new Error('未提供学科兴趣数据');
    }
    if (Object.keys(this.abilities).length === 0) {
      throw new Error('未提供能力数据');
    }
    return true;
  }

  /**
   * 规范化用户数据到 0-1 范围
   */
  normalize() {
    // 学科兴趣规范化
    const maxDisciplineScore = Math.max(...Object.values(this.disciplines));
    Object.keys(this.disciplines).forEach(key => {
      this.disciplines[key] = this.disciplines[key] / 100;
    });

    // 能力规范化
    Object.keys(this.abilities).forEach(key => {
      this.abilities[key] = this.abilities[key] / 100;
    });

    return this;
  }

  /**
   * 生成用户特征向量
   */
  getFeatureVector() {
    return {
      disciplines: { ...this.disciplines },
      abilities: { ...this.abilities },
      careerGoals: { ...this.careerGoals },
      preferences: { ...this.preferences }
    };
  }
}

/**
 * 推荐引擎核心类
 */
class RecommendationEngine {
  constructor(disciplinesData) {
    this.disciplinesData = disciplinesData;
    this.cache = new Map();
  }

  /**
   * 主推荐函数
   * @param {UserProfile} userProfile 用户信息
   * @returns {Array} 推荐的专业列表
   */
  recommend(userProfile) {
    userProfile.normalize();
    userProfile.validate();

    // 计算所有专业的匹配分数
    const allMajors = this.getAllMajors();
    const scores = allMajors.map(major => ({
      ...major,
      matchScore: this.calculateMatchScore(userProfile, major),
      matchDetails: this.getMatchDetails(userProfile, major)
    }));

    // 按匹配分数排序
    scores.sort((a, b) => b.matchScore - a.matchScore);

    // 返回TOP 10推荐
    return scores.slice(0, 10);
  }

  /**
   * 获取所有专业
   */
  getAllMajors() {
    const majors = [];
    this.disciplinesData.forEach(discipline => {
      discipline.majorGroups.forEach(majorGroup => {
        majorGroup.majors.forEach(major => {
          majors.push({
            id: major.id,
            code: major.code,
            name: major.name,
            description: major.description,
            disciplineName: discipline.name,
            disciplineCode: discipline.code,
            majorGroupName: majorGroup.name,
            coreCourses: major.coreCourses || [],
            relatedSkills: major.relatedSkills || [],
            careerPaths: major.careerPaths || [],
            employmentRate: major.employmentRate || 0.85,
            averageSalary: major.averageSalary || 0
          });
        });
      });
    });
    return majors;
  }

  /**
   * 计算专业与用户的匹配分数
   */
  calculateMatchScore(userProfile, major) {
    let totalScore = 0;
    let totalWeight = 0;

    // 1. 学科兴趣匹配度 (40%)
    const disciplineScore = this.calculateDisciplineMatch(userProfile, major);
    totalScore += disciplineScore * 0.40;
    totalWeight += 0.40;

    // 2. 能力匹配度 (25%)
    const abilityScore = this.calculateAbilityMatch(userProfile, major);
    totalScore += abilityScore * 0.25;
    totalWeight += 0.25;

    // 3. 职业目标匹配度 (20%)
    const careerGoalScore = this.calculateCareerGoalMatch(userProfile, major);
    totalScore += careerGoalScore * 0.20;
    totalWeight += 0.20;

    // 4. 其他因素 (15%)
    const otherScore = this.calculateOtherFactors(userProfile, major);
    totalScore += otherScore * 0.15;
    totalWeight += 0.15;

    return Math.round((totalScore / totalWeight) * 100) / 100;
  }

  /**
   * 计算学科兴趣匹配度
   */
  calculateDisciplineMatch(userProfile, major) {
    const disciplineCode = major.disciplineCode;
    const disciplineKey = Object.keys(DISCIPLINE_MAPPING).find(
      key => DISCIPLINE_MAPPING[key] === disciplineCode
    );

    if (!disciplineKey) return 0.5;

    const userScore = userProfile.disciplines[disciplineKey] || 0;
    return Math.min(userScore, 1.0);
  }

  /**
   * 计算能力匹配度
   */
  calculateAbilityMatch(userProfile, major) {
    let totalScore = 0;
    let weight = 0;

    // 遍历用户拥有的能力
    Object.keys(userProfile.abilities).forEach(ability => {
      const abilityScore = userProfile.abilities[ability];
      const abilityWeight = ABILITY_MAJOR_MAPPING[ability]?.weight || 0;

      if (ABILITY_MAJOR_MAPPING[ability]?.majors.includes(major.code)) {
        totalScore += abilityScore * abilityWeight;
        weight += abilityWeight;
      }
    });

    return weight > 0 ? totalScore / weight : 0.5;
  }

  /**
   * 计算职业目标匹配度
   */
  calculateCareerGoalMatch(userProfile, major) {
    let totalScore = 0;
    let weight = 0;

    Object.keys(userProfile.careerGoals).forEach(goal => {
      const goalWeight = CAREER_GOAL_MAJOR_MAPPING[goal]?.weight || 0;

      if (CAREER_GOAL_MAJOR_MAPPING[goal]?.majors.includes(major.code)) {
        totalScore += 1.0 * goalWeight;
        weight += goalWeight;
      }
    });

    // 薪资期望匹配
    if (userProfile.preferences.minSalary) {
      const salaryMatch = Math.min(
        major.averageSalary / userProfile.preferences.minSalary,
        1.0
      );
      totalScore += salaryMatch * 0.15;
      weight += 0.15;
    }

    return weight > 0 ? totalScore / weight : 0.5;
  }

  /**
   * 计算其他因素（地区、就业率等）
   */
  calculateOtherFactors(userProfile, major) {
    let score = 0.5;

    // 就业率影响
    score = (score + major.employmentRate) / 2;

    // 地区偏好
    if (userProfile.preferences.region) {
      // TODO: 实现地区匹配逻辑
      score = (score + 0.7) / 2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * 获取匹配详情
   */
  getMatchDetails(userProfile, major) {
    return {
      disciplineMatch: {
        score: this.calculateDisciplineMatch(userProfile, major),
        reason: `与您对${major.disciplineName}的兴趣完全匹配`
      },
      abilityMatch: {
        score: this.calculateAbilityMatch(userProfile, major),
        reason: `需要您的核心能力：${Object.keys(userProfile.abilities).slice(0, 3).join('、')}`
      },
      careerMatch: {
        score: this.calculateCareerGoalMatch(userProfile, major),
        reason: `符合您的职业目标和薪资期望`
      },
      salaryMatch: {
        score: major.averageSalary / (userProfile.preferences.minSalary || 20000),
        salary: major.averageSalary,
        reason: `平均薪资 ${major.averageSalary}元，${major.averageSalary >= (userProfile.preferences.minSalary || 20000) ? '符合' : '略低于'}期望`
      },
      employmentMatch: {
        score: major.employmentRate,
        rate: major.employmentRate,
        reason: `就业率${(major.employmentRate * 100).toFixed(0)}%，市场需求量大`
      }
    };
  }

  /**
   * 获取推荐理由列表
   */
  getRecommendationReasons(userProfile, major) {
    const details = this.getMatchDetails(userProfile, major);
    const reasons = [];

    if (details.disciplineMatch.score > 0.7) {
      reasons.push(`与您对${major.disciplineName}的兴趣完全匹配 (${(details.disciplineMatch.score * 100).toFixed(0)}分)`);
    }

    if (details.abilityMatch.score > 0.7) {
      reasons.push(`需要您的高分析能力 (${(details.abilityMatch.score * 100).toFixed(0)}分)`);
    }

    if (major.averageSalary >= (userProfile.preferences.minSalary || 20000)) {
      reasons.push(`符合高薪期望 (${major.averageSalary}元平均)`);
    }

    if (major.employmentRate > 0.90) {
      reasons.push(`未来需求量大 (就业率${(major.employmentRate * 100).toFixed(0)}%)`);
    }

    return reasons.length > 0 ? reasons : ['推荐指数高'];
  }

  /**
   * 对比两个专业
   */
  compareSpecialties(userProfile, major1Id, major2Id) {
    const allMajors = this.getAllMajors();
    const major1 = allMajors.find(m => m.code === major1Id);
    const major2 = allMajors.find(m => m.code === major2Id);

    if (!major1 || !major2) {
      throw new Error('专业不存在');
    }

    return {
      major1: {
        ...major1,
        matchScore: this.calculateMatchScore(userProfile, major1),
        advantages: this.getMatchDetails(userProfile, major1)
      },
      major2: {
        ...major2,
        matchScore: this.calculateMatchScore(userProfile, major2),
        advantages: this.getMatchDetails(userProfile, major2)
      },
      recommendation: this.calculateMatchScore(userProfile, major1) >
                     this.calculateMatchScore(userProfile, major2) ? major1Id : major2Id
    };
  }
}

/**
 * 推荐系统导出 (ESM)
 */
export {
  UserProfile,
  RecommendationEngine,
  DISCIPLINE_MAPPING,
  ABILITY_MAJOR_MAPPING,
  CAREER_GOAL_MAJOR_MAPPING
};
