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

const SOCIAL_SVGS = {
  github: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
  portfolio: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`,
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

  Handlebars.registerHelper('toSocialSvg', (text) => {
    const key = text.trim().toLowerCase();
    return new Handlebars.SafeString(SOCIAL_SVGS[key] || SOCIAL_SVGS.portfolio);
  });

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
