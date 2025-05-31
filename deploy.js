#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const DIST_DIR = './dist';
const DEPLOY_BRANCH = 'gh-pages';
const GITHUB_USERNAME = 'skdonepudi';
const GITHUB_REPO = 'resume';

async function deploy() {
  try {
    // Build the project
    console.log('Building project...');
    execSync('npm run build', { stdio: 'inherit' });

    // Create or update gh-pages branch
    console.log('Setting up deployment branch...');
    try {
      execSync(`git checkout ${DEPLOY_BRANCH}`, { stdio: 'inherit' });
    } catch {
      execSync(`git checkout -b ${DEPLOY_BRANCH}`, { stdio: 'inherit' });
    }

    // Copy dist contents to root
    console.log('Copying build files...');
    const files = await fs.readdir(DIST_DIR);
    for (const file of files) {
      await fs.copyFile(path.join(DIST_DIR, file), path.join('.', file));
    }

    // Add and commit changes
    console.log('Committing changes...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Deploy to GitHub Pages"', { stdio: 'inherit' });

    // Push to GitHub
    console.log('Pushing to GitHub...');
    execSync(`git push origin ${DEPLOY_BRANCH}`, { stdio: 'inherit' });

    // Switch back to main branch
    execSync('git checkout main', { stdio: 'inherit' });

    console.log('Deployment complete!');
    console.log(
      `Your resume should be available at: https://${GITHUB_USERNAME}.github.io/${GITHUB_REPO}/`
    );
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

deploy();
