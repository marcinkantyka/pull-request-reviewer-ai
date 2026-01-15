import { execSync } from 'child_process';
import type { PRInfo } from './types.js';

export class GitHubHelper {
  constructor(private repoPath: string) {}

  getRepoInfo(): { owner: string; repo: string } {
    try {
      const remoteUrl = execSync('git config --get remote.origin.url', {
        cwd: this.repoPath,
        encoding: 'utf-8'
      }).trim();

      if (!remoteUrl) {
        throw new Error('No git remote found. Make sure the repository has a remote.origin.url configured');
      }

      const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
      
      if (!match) {
        throw new Error(`Could not parse GitHub repository URL: ${remoteUrl}. Make sure the remote points to a GitHub repository.`);
      }

      const [, owner, repo] = match;
      return { owner, repo: repo.replace('.git', '') };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Command failed')) {
        throw new Error(`Git command failed in ${this.repoPath}. Make sure this is a valid git repository with a GitHub remote configured.`);
      }
      throw new Error(`Failed to get repository info: ${errorMessage}`);
    }
  }

  async listOpenPRs(limit: number = 20): Promise<PRInfo[]> {
    try {
      return await this.listBranchesLocally(limit);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('No branches found')) {
        throw error;
      }
      throw new Error(`Failed to list branches: ${errorMessage}`);
    }
  }

  async listBranchesLocally(limit: number = 20): Promise<PRInfo[]> {
    try {
      const baseBranch = process.env.BASE_BRANCH || 'main';
      
      let remoteBranches: string[] = [];
      
      try {
        const branchesOutput = execSync(
          'git branch -r',
          { cwd: this.repoPath, encoding: 'utf-8', stdio: 'pipe' }
        );
        
        remoteBranches = branchesOutput
          .trim()
          .split('\n')
          .map(b => b.trim().replace(/^origin\//, ''))
          .filter(b => b.length > 0 && b !== 'HEAD' && b !== baseBranch)
          .slice(0, limit);
      } catch (err) {
        throw new Error('No branches found. Make sure to run "git fetch origin" on the host before running the review.');
      }

      if (remoteBranches.length === 0) {
        throw new Error(`No branches found to review (only found base branch: ${baseBranch}). Make sure to run "git fetch origin" on the host first.`);
      }

      const branches: PRInfo[] = [];

      for (const branch of remoteBranches) {
        try {
          let author = 'Unknown';
          let commitMessage = `Branch: ${branch}`;
          
          try {
            const logOutput = execSync(
              `git log origin/${baseBranch}..origin/${branch} --format='%an|%s' -1`,
              { cwd: this.repoPath, encoding: 'utf-8', stdio: 'pipe' }
            ).trim();
            
            if (logOutput) {
              const [logAuthor, logMessage] = logOutput.split('|');
              author = logAuthor || 'Unknown';
              commitMessage = logMessage || commitMessage;
            }
          } catch (logErr) {
            try {
              author = execSync(
                `git log origin/${branch} --format='%an' -1`,
                { cwd: this.repoPath, encoding: 'utf-8', stdio: 'pipe' }
              ).trim() || 'Unknown';
            } catch (e) {
            }
          }

          branches.push({
            number: branches.length + 1,
            title: commitMessage,
            branch: branch,
            author: author,
            baseBranch: baseBranch,
            url: undefined
          });
        } catch (err) {
          branches.push({
            number: branches.length + 1,
            title: `Branch: ${branch}`,
            branch: branch,
            author: 'Unknown',
            baseBranch: baseBranch,
            url: undefined
          });
        }
      }

      return branches;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list branches locally: ${errorMessage}`);
    }
  }

  getPRDiff(prBranch: string, baseBranch: string): string {
    try {
      const diff = execSync(
        `git diff origin/${baseBranch}...origin/${prBranch}`,
        {
          cwd: this.repoPath,
          encoding: 'utf-8',
          maxBuffer: 50 * 1024 * 1024
        }
      );

      return diff;
    } catch (error) {
      throw new Error(`Failed to get PR diff: ${error}`);
    }
  }

  getChangedFiles(prBranch: string, baseBranch: string): string[] {
    try {
      const files = execSync(
        `git diff --name-only origin/${baseBranch}...origin/${prBranch}`,
        {
          cwd: this.repoPath,
          encoding: 'utf-8'
        }
      )
        .trim()
        .split('\n')
        .filter(f => f.length > 0);

      return files;
    } catch (error) {
      throw new Error(`Failed to get changed files: ${error}`);
    }
  }

  getDiffStats(prBranch: string, baseBranch: string): {
    filesChanged: number;
    insertions: number;
    deletions: number;
  } {
    try {
      const stats = execSync(
        `git diff --shortstat origin/${baseBranch}...origin/${prBranch}`,
        {
          cwd: this.repoPath,
          encoding: 'utf-8'
        }
      ).trim();

      const filesMatch = stats.match(/(\d+) files? changed/);
      const insertionsMatch = stats.match(/(\d+) insertions?/);
      const deletionsMatch = stats.match(/(\d+) deletions?/);

      return {
        filesChanged: filesMatch ? parseInt(filesMatch[1]) : 0,
        insertions: insertionsMatch ? parseInt(insertionsMatch[1]) : 0,
        deletions: deletionsMatch ? parseInt(deletionsMatch[1]) : 0
      };
    } catch (error) {
      return { filesChanged: 0, insertions: 0, deletions: 0 };
    }
  }

  branchExists(branch: string): boolean {
    try {
      execSync(`git rev-parse --verify origin/${branch}`, {
        cwd: this.repoPath,
        stdio: 'pipe'
      });
      return true;
    } catch {
      return false;
    }
  }
}