// ─── services/resumeParser.service.js ─────────────────────────────────────────
// Extracts skills, experience, and education from cover notes, resume text, or candidate input.

const COMMON_SKILLS_KEYWORDS = [
  'JavaScript', 'TypeScript', 'React', 'React Native', 'Node.js', 'Express',
  'Vue.js', 'Angular', 'Next.js', 'Python', 'Django', 'Flask', 'Java', 'Spring Boot',
  'C++', 'C#', '.NET', 'PHP', 'Laravel', 'Ruby', 'Ruby on Rails', 'Go', 'Golang',
  'Rust', 'Swift', 'Kotlin', 'Flutter', 'HTML', 'CSS', 'Tailwind CSS', 'Sass',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Linux',
  'Machine Learning', 'Data Analysis', 'UI/UX Design', 'Figma', 'Agile', 'Scrum',
  'Project Management', 'Communication', 'Problem Solving', 'Leadership'
];

/**
 * Parses skills from text or comma-separated string
 */
export const extractSkillsFromText = (text = '') => {
  if (!text) return [];
  const found = new Set();
  const lowerText = text.toLowerCase();

  for (const skill of COMMON_SKILLS_KEYWORDS) {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\b|\\s)${escaped}(?:$|\\b|\\s)`, 'i');
    if (regex.test(lowerText) || text.includes(skill)) {
      found.add(skill);
    }
  }

  // Also check if text is a comma-separated list of custom skills
  if (text.includes(',')) {
    text.split(',').forEach(item => {
      const trimmed = item.trim();
      if (trimmed && trimmed.length <= 40) {
        found.add(trimmed);
      }
    });
  }

  return Array.from(found);
};

/**
 * Auto-extracts profile fields (skills, headline) when a candidate submits an application
 */
export const autoPopulateCandidateProfile = (profile, coverNote = '', textExtra = '') => {
  const updatedProfile = { ...profile };
  const combinedText = `${coverNote} ${textExtra}`;

  const extractedSkills = extractSkillsFromText(combinedText);
  if (!updatedProfile.skills || updatedProfile.skills.length === 0) {
    if (extractedSkills.length > 0) {
      updatedProfile.skills = extractedSkills;
    }
  }

  return updatedProfile;
};
