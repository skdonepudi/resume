import fs from 'fs/promises';
import Handlebars from 'handlebars';
import gravatar from 'gravatar';
import { find, each } from 'lodash-es';
import { capitalize } from 'lodash-es';
import moment from 'moment';
import axios from 'axios';

/**
 * @typedef {Object} Resume
 * @property {Object} basics
 * @property {string} basics.email
 * @property {string} basics.picture
 * @property {Array} basics.profiles
 * @property {Array} work
 * @property {Array} skills
 * @property {Array} education
 * @property {Array} awards
 * @property {Array} publications
 * @property {Array} volunteer
 * @property {Array} projects
 */

const hasEmail = (resume) => !!resume.basics?.email;

const getNetwork = (profiles, networkName) =>
  find(profiles, (profile) => profile.network.toLowerCase() === networkName);

const humanizeDuration = (momentObj, didLeaveCompany) => {
  const months = momentObj.months();
  const years = momentObj.years();
  const monthStr = months > 1 ? 'months' : 'month';
  const yearStr = years > 1 ? 'years' : 'year';

  if (months && years) {
    return `${years} ${yearStr} ${months} ${monthStr}`;
  }

  if (months) {
    return `${months} ${monthStr}`;
  }

  if (years) {
    return `${years} ${yearStr}`;
  }

  if (didLeaveCompany) {
    const days = momentObj.days();
    return days > 1 ? `${days} days` : `${days} day`;
  }

  return 'Recently joined';
};

const URL_MAP = {
  github: 'github.com',
  x: 'x.com',
  soundcloud: 'soundcloud.com',
  pinterest: 'pinterest.com',
  vimeo: 'vimeo.com',
  behance: 'behance.net',
  codepen: 'codepen.io',
  foursquare: 'foursquare.com',
  reddit: 'reddit.com',
  spotify: 'spotify.com',
  dribble: 'dribbble.com',
  dribbble: 'dribbble.com',
  facebook: 'facebook.com',
  angellist: 'angel.co',
  bitbucket: 'bitbucket.org',
};

const getUrlFromUsername = (site, username) => {
  site = site.toLowerCase();

  if (!username || !URL_MAP[site]) {
    return;
  }

  switch (site) {
    case 'skype':
      return `skype:${username}?call`;
    case 'reddit':
    case 'spotify':
      return `//open.${URL_MAP[site]}/user/${username}`;
    default:
      return `//${URL_MAP[site]}/${username}`;
  }
};

const githubRepoCache = new Map();

const getGithubApi = (url) =>
  url.replace('https://github.com/', 'https://api.github.com/repos/');

const getRepoStars = async (url) => {
  if (githubRepoCache.has(url)) {
    return githubRepoCache.get(url).stargazers_count;
  }

  try {
    const api = getGithubApi(url);
    const { data } = await axios.get(api);
    githubRepoCache.set(url, data);
    return data.stargazers_count;
  } catch (error) {
    console.error('Error fetching GitHub repo data:', error.message);
    return 'NaN';
  }
};

const SOCIAL_SITES = [
  'github',
  'linkedin',
  'stackoverflow',
  'x',
  'soundcloud',
  'pinterest',
  'vimeo',
  'behance',
  'codepen',
  'foursquare',
  'reddit',
  'spotify',
  'dribble',
  'dribbble',
  'facebook',
  'angellist',
  'bitbucket',
  'skype',
];

const DATE_FORMAT = 'MMM YYYY';

const SOCIAL_ICONS = {
  linkedin: 'ri:linkedin-box-fill',
  github: 'ri:github-fill',
  instagram: 'ri:instagram-line',
  x: 'ri:twitter-x-line',
  website: 'ri:global-line',
  link: 'ri:arrow-right-up-line',
  portfolio: 'ri:global-line',
};

export const render = async (resume) => {
  if (!resume.basics) {
    throw new Error('Resume basics not found');
  }

  const [css, template] = await Promise.all([
    fs.readFile(new URL('./assets/css/theme.css', import.meta.url), 'utf-8'),
    fs.readFile(new URL('./resume.hbs', import.meta.url), 'utf-8'),
  ]);

  const { profiles } = resume.basics;

  // Add Gravatar if no picture is provided
  if (!resume.basics.picture && hasEmail(resume)) {
    resume.basics.picture = gravatar.url(
      resume.basics.email.replace('(at)', '@'),
      {
        s: '100',
        r: 'pg',
        d: 'mm',
      }
    );
  }

  // Add languages to basics
  if (resume.languages) {
    resume.basics.languages = resume.languages
      .map((language) => language.language)
      .join(', ');
  }

  // Process work experience
  each(resume.work, (workInfo) => {
    const startDate = workInfo.startDate && new Date(workInfo.startDate);
    const endDate = workInfo.endDate && new Date(workInfo.endDate);

    if (startDate) {
      workInfo.startDate = moment(startDate).format(DATE_FORMAT);
    }

    if (endDate) {
      workInfo.endDate = moment(endDate).format(DATE_FORMAT);
    }

    const didLeaveCompany = !!endDate;

    if (startDate) {
      const endDateOrNow = endDate || new Date();
      workInfo.duration = humanizeDuration(
        moment.duration(endDateOrNow.getTime() - startDate.getTime()),
        didLeaveCompany
      );
    }
  });

  // Process skills
  each(resume.skills, (skillInfo) => {
    const levels = ['Beginner', 'Intermediate', 'Advanced', 'Master'];

    if (skillInfo.level) {
      skillInfo.skill_class = skillInfo.level.toLowerCase();
      skillInfo.level = capitalize(skillInfo.level.trim());
      skillInfo.display_progress_bar = levels.includes(skillInfo.level);
    }
  });

  // Process education
  each(resume.education, (educationInfo) => {
    each(['startDate', 'endDate'], (date) => {
      const dateObj = new Date(educationInfo[date]);
      if (educationInfo[date]) {
        educationInfo[date] = moment(dateObj).format(DATE_FORMAT);
      }
    });
  });

  // Process awards
  each(resume.awards, (awardInfo) => {
    if (awardInfo.date) {
      awardInfo.date = moment(new Date(awardInfo.date)).format(DATE_FORMAT);
    }
  });

  // Process publications
  each(resume.publications, (publicationInfo) => {
    if (publicationInfo.releaseDate) {
      publicationInfo.releaseDate = moment(
        new Date(publicationInfo.releaseDate)
      ).format('MMM DD, YYYY');
    }
  });

  // Process volunteer work
  each(resume.volunteer, (volunteerInfo) => {
    each(['startDate', 'endDate'], (date) => {
      const dateObj = new Date(volunteerInfo[date]);
      if (volunteerInfo[date]) {
        volunteerInfo[date] = moment(dateObj).format(DATE_FORMAT);
      }
    });
  });

  // Process social profiles
  each(SOCIAL_SITES, (site) => {
    const socialAccount = getNetwork(profiles, site);
    if (socialAccount) {
      const username = socialAccount.username;
      resume.basics[`${site}_url`] =
        getUrlFromUsername(site, username) || socialAccount.url;
    }
  });

  // Process GitHub projects
  await Promise.all(
    resume.projects.map(async (project) => {
      if (project.githubUrl) {
        project.stars = await getRepoStars(project.githubUrl);
      }
    })
  );

  // Register Handlebars helpers
  Handlebars.registerHelper(
    'toSocialIcon',
    (text) => SOCIAL_ICONS[text.trim().toLowerCase()]
  );

  Handlebars.registerHelper('join', (arr) => arr.join(', '));
  Handlebars.registerHelper('getGithubApi', getGithubApi);

  Handlebars.registerHelper('breaklines', (text) => {
    text = Handlebars.Utils.escapeExpression(text);
    text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
    return new Handlebars.SafeString(text);
  });

  Handlebars.registerHelper('getBuildDate', () =>
    moment().format('MMMM Do YYYY, h:mm:ss a')
  );

  return Handlebars.compile(template)({
    css,
    resume,
  });
};
