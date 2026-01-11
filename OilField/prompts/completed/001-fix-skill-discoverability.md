<objective>
Diagnose why the deploy-local-docker skill is not discoverable by Claude Code CLI and fix the issue.

The skill exists but doesn't appear in the available skills list, preventing users from invoking it.
</objective>

<context>
Claude Code skills can be defined in two locations:
- User-level: `~/.claude/skills/[skill-name]/`
- Project-level: `.claude/skills/[skill-name]/`

Working skills exist at:
- `~/.claude/skills/deploy-digitalocean/SKILL.md`
- `~/.claude/skills/ensure-gitflow-cicd/SKILL.md`

Non-working skill exists at:
- `.claude/skills/deploy-local-docker/skill.md`
</context>

<research>
1. Compare the working skills with the non-working skill:
   - File naming conventions (SKILL.md vs skill.md)
   - Directory structure
   - Frontmatter format
   - File permissions

2. Check Claude Code documentation or existing skills for:
   - Required file name (case-sensitive?)
   - Required frontmatter fields
   - Required directory structure

3. Examine working skill structure:
   ```bash
   ls -la ~/.claude/skills/deploy-digitalocean/
   head -20 ~/.claude/skills/deploy-digitalocean/SKILL.md
   ```

4. Compare with non-working skill:
   ```bash
   ls -la .claude/skills/deploy-local-docker/
   head -20 .claude/skills/deploy-local-docker/skill.md
   ```
</research>

<requirements>
1. Identify ALL differences between working and non-working skills
2. Determine which differences are causing the discoverability issue
3. Fix the deploy-local-docker skill to be discoverable
4. Verify the fix works
</requirements>

<implementation>
Apply fixes based on findings. Likely issues to check:
- Filename: `skill.md` should be `SKILL.md` (uppercase)
- Location: Project `.claude/` may need different handling than user `~/.claude/`
- Frontmatter: Must have correct YAML format with name and description
- Permissions: Files should be readable

Make minimal changes to fix discoverability while preserving content.
</implementation>

<output>
- Fix the skill file(s) in place
- Document what was wrong and what was fixed
</output>

<verification>
After applying fixes:
1. Check if skill appears in available skills list
2. Try to invoke the skill
3. Confirm the skill content is intact and functional

Report the root cause and the fix applied.
</verification>

<success_criteria>
- Root cause identified and documented
- deploy-local-docker skill appears in Claude Code's available skills
- Skill can be successfully invoked
- Skill content and functionality preserved
</success_criteria>
