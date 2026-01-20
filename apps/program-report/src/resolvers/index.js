import Resolver from '@forge/resolver';
import api, { route, storage } from '@forge/api';

const resolver = new Resolver();

const MAX_RESULTS = 100;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const CUSTOM_FIELDS = {
    STORY_POINTS: 'customfield_10005',
    SPRINT: 'customfield_10007',
    EPIC_START_DATE: 'customfield_11535',
    EPIC_END_DATE: 'customfield_11728'
};

/**
 * Fetch with retry logic for rate limiting
 */
async function fetchWithRetry(requestFn, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await requestFn();

            // Handle rate limiting (429)
            if (response.status === 429) {
                const retryAfter = response.headers?.get?.('Retry-After') || Math.pow(2, attempt);
                console.log(`Rate limited, retrying after ${retryAfter}s (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(r => setTimeout(r, retryAfter * 1000));
                continue;
            }

            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            return response;
        } catch (error) {
            if (attempt === maxRetries - 1) throw error;
            const backoff = Math.pow(2, attempt) * 1000;
            console.log(`Request failed, retrying in ${backoff}ms (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(r => setTimeout(r, backoff));
        }
    }
}

/**
 * Fetches all issues using JQL with pagination
 */
async function getAllJiraIssues(jql) {
    let issues = [];
    let nextPageToken = null;

    console.log('Executing JQL:', jql);

    do {
        const body = {
            jql: jql,
            fields: ['assignee', 'issuelinks', 'summary', 'description', CUSTOM_FIELDS.STORY_POINTS, CUSTOM_FIELDS.SPRINT, CUSTOM_FIELDS.EPIC_START_DATE, CUSTOM_FIELDS.EPIC_END_DATE, 'status', 'issuetype', 'parent', 'duedate', 'created'],
            maxResults: MAX_RESULTS
        };

        if (nextPageToken) {
            body.nextPageToken = nextPageToken;
        }

        try {
            const response = await fetchWithRetry(() =>
                api.asUser().requestJira(
                    route`/rest/api/3/search/jql`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    }
                )
            );

            const data = await response.json();
            issues = issues.concat(data.issues || []);
            nextPageToken = data.nextPageToken;
        } catch (error) {
            console.error(`JQL query failed:`, error.message);
            break;
        }

    } while (nextPageToken);

    return issues;
}

/**
 * Builds a map of linked issue keys to their link info from multiple stories
 * Used for batching linked issue fetches
 */
function buildLinkMapFromStories(stories) {
    // Map: linkedIssueKey -> { storyKey: linkInfo }
    const globalLinkMap = new Map();

    stories.forEach(story => {
        (story.fields.issuelinks || []).forEach(link => {
            const key = link.outwardIssue?.key || link.inwardIssue?.key;
            if (key) {
                let relation = "";
                if (link.outwardIssue) {
                    relation = link.type.outward;
                } else {
                    relation = link.type.inward;
                }

                if (!globalLinkMap.has(key)) {
                    globalLinkMap.set(key, { storyLinks: new Map() });
                }

                const issueInfo = globalLinkMap.get(key);
                if (!issueInfo.storyLinks.has(story.key)) {
                    issueInfo.storyLinks.set(story.key, { relations: [], linkTypes: [] });
                }

                const storyInfo = issueInfo.storyLinks.get(story.key);
                storyInfo.relations.push(relation);
                storyInfo.linkTypes.push(link.type.name);
            }
        });
    });

    return globalLinkMap;
}

/**
 * Batch fetch all linked issues from multiple stories at once
 * Reduces N+1 API calls to a single query
 */
async function batchFetchLinkedIssues(stories) {
    const globalLinkMap = buildLinkMapFromStories(stories);
    const allLinkedKeys = Array.from(globalLinkMap.keys());

    if (allLinkedKeys.length === 0) {
        return new Map(); // issueKey -> issue with linkInfo
    }

    // Fetch all linked issues in a single JQL query
    // Split into batches of 100 to avoid JQL limits
    const allIssues = [];
    const batchSize = 100;

    for (let i = 0; i < allLinkedKeys.length; i += batchSize) {
        const batchKeys = allLinkedKeys.slice(i, i + batchSize);
        const jql = `key IN (${batchKeys.map(k => `"${k}"`).join(",")})`;
        const batchIssues = await getAllJiraIssues(jql);
        allIssues.push(...batchIssues);
    }

    // Build result map: issueKey -> issue with link info
    const issueMap = new Map();
    allIssues.forEach(issue => {
        issueMap.set(issue.key, issue);
    });

    return { issueMap, globalLinkMap };
}

/**
 * Get linked issues for a specific story using pre-fetched batch data
 */
function getLinkedIssuesForStoryFromBatch(story, issueMap, globalLinkMap) {
    const linkedIssues = [];

    (story.fields.issuelinks || []).forEach(link => {
        const key = link.outwardIssue?.key || link.inwardIssue?.key;
        if (key && issueMap.has(key)) {
            const issue = issueMap.get(key);
            const linkMapEntry = globalLinkMap.get(key);
            const storyInfo = linkMapEntry?.storyLinks.get(story.key);

            let primaryRelation = "";
            let primaryType = "";

            if (storyInfo) {
                const splitIndex = storyInfo.linkTypes.indexOf("Work item split");
                if (splitIndex >= 0) {
                    primaryRelation = storyInfo.relations[splitIndex];
                    primaryType = "Work item split";
                } else if (storyInfo.linkTypes.length > 0) {
                    primaryRelation = storyInfo.relations[0];
                    primaryType = storyInfo.linkTypes[0];
                }
            }

            // Avoid duplicates
            if (!linkedIssues.find(i => i.key === issue.key)) {
                linkedIssues.push({
                    ...issue,
                    linkInfo: storyInfo ? {
                        relation: primaryRelation,
                        linkType: primaryType,
                        allTypes: storyInfo.linkTypes
                    } : null
                });
            }
        }
    });

    return linkedIssues;
}

/**
 * Fetches linked issues for a Story (Standard Epic Breakdown logic)
 * @deprecated Use batchFetchLinkedIssues for better performance
 */
async function getLinkedIssuesForStory(story) {
    const linkMap = new Map();

    (story.fields.issuelinks || []).forEach(link => {
        const key = link.outwardIssue?.key || link.inwardIssue?.key;
        // Filter out pixel or specific unrelated keys if needed, keeping generic for now
        if (key) {
            let relation = "";
            if (link.outwardIssue) {
                relation = link.type.outward; // Split To
            } else {
                relation = link.type.inward; // Split From
            }

            if (!linkMap.has(key)) {
                linkMap.set(key, { relations: [], linkTypes: [] });
            }
            const info = linkMap.get(key);
            info.relations.push(relation);
            info.linkTypes.push(link.type.name);
        }
    });

    const linkedKeys = Array.from(linkMap.keys());
    if (linkedKeys.length === 0) return [];

    const jql = `key IN (${linkedKeys.map(k => `"${k}"`).join(",")})`;
    const issues = await getAllJiraIssues(jql);

    return issues.map(issue => {
        const info = linkMap.get(issue.key);
        let primaryRelation = "";
        let primaryType = "";

        if (info) {
            const splitIndex = info.linkTypes.indexOf("Work item split");
            if (splitIndex >= 0) {
                primaryRelation = info.relations[splitIndex];
                primaryType = "Work item split";
            } else if (info.linkTypes.length > 0) {
                primaryRelation = info.relations[0];
                primaryType = info.linkTypes[0];
            }
        }

        return {
            ...issue,
            linkInfo: info ? {
                relation: primaryRelation,
                linkType: primaryType,
                allTypes: info.linkTypes
            } : null
        };
    });
}

function getNewestSprintName(sprints) {
    if (!sprints || !Array.isArray(sprints) || sprints.length === 0) return "";
    sprints.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    return sprints[0]?.name || "";
}

/**
 * Extract epic dependencies from issue links
 * Returns { blockedBy: [], blocks: [] } containing epic keys
 */
function extractDependencies(epic, programEpicKeys) {
    const blockedBy = [];
    const blocks = [];

    (epic.fields.issuelinks || []).forEach(link => {
        const linkTypeName = link.type?.name || '';

        // Check for "Blocks" link type
        if (linkTypeName === 'Blocks') {
            // outwardIssue with "blocks" = this epic blocks that one
            if (link.outwardIssue && programEpicKeys.has(link.outwardIssue.key)) {
                blocks.push(link.outwardIssue.key);
            }
            // inwardIssue with "is blocked by" = this epic is blocked by that one
            if (link.inwardIssue && programEpicKeys.has(link.inwardIssue.key)) {
                blockedBy.push(link.inwardIssue.key);
            }
        }
    });

    return { blockedBy, blocks };
}

/**
 * Core logic to breakdown a single Epic
 * Uses pre-fetched batch data for linked issues
 * Returns breakdown data + statistics for progress
 */
function processEpicData(epic, stories, tasks, issueMap, globalLinkMap, programEpicKeys = new Set()) {
    // Combine stories and tasks for processing
    const allChildren = [...stories, ...tasks];

    // Track all counted issue keys to avoid duplicates
    const countedIssueKeys = new Set();

    let totalIssues = 0;
    let issuesDone = 0;
    let storyPointsTotal = 0;
    let storyPointsCompleted = 0;
    const assigneesSet = new Set();
    let earliestChildCreated = null;

    // Process direct children (Stories + Tasks)
    allChildren.forEach(child => {
        // Skip if already counted (shouldn't happen for direct children, but safety check)
        if (countedIssueKeys.has(child.key)) return;
        countedIssueKeys.add(child.key);

        totalIssues++;

        const createdDate = child.fields.created ? new Date(child.fields.created) : null;
        if (createdDate && (!earliestChildCreated || createdDate < earliestChildCreated)) {
            earliestChildCreated = createdDate;
        }
        // Collect assignees
        if (child.fields.assignee?.displayName) {
            assigneesSet.add(child.fields.assignee.displayName);
        }
        // Collect story points from direct children
        const childPoints = child.fields[CUSTOM_FIELDS.STORY_POINTS] || 0;
        storyPointsTotal += childPoints;
        if (child.fields.status?.statusCategory?.key === 'done') {
            storyPointsCompleted += childPoints;
            issuesDone++;
        }
    });

    // Detailed breakdown for stories using pre-fetched batch data
    const storyData = stories.map(story => {
        const linkedIssues = getLinkedIssuesForStoryFromBatch(story, issueMap, globalLinkMap);

        // Process linked issues, but only count if not already counted
        linkedIssues.forEach(issue => {
            if (countedIssueKeys.has(issue.key)) return; // Skip duplicates
            countedIssueKeys.add(issue.key);

            totalIssues++;

            // Collect assignees from linked issues
            if (issue.fields.assignee?.displayName) {
                assigneesSet.add(issue.fields.assignee.displayName);
            }
            // Collect story points from linked issues
            const points = issue.fields[CUSTOM_FIELDS.STORY_POINTS] || 0;
            storyPointsTotal += points;

            const isDone = ['Done', 'Closed', 'Resolved'].includes(issue.fields.status?.statusCategory?.name) ||
                ['Done', 'Closed'].includes(issue.fields.status?.name);
            if (isDone) {
                storyPointsCompleted += points;
                issuesDone++;
            }

            // Track earliest creation date
            const createdDate = issue.fields.created ? new Date(issue.fields.created) : null;
            if (createdDate && (!earliestChildCreated || createdDate < earliestChildCreated)) {
                earliestChildCreated = createdDate;
            }
        });

        const storyIssuesDone = linkedIssues.filter(issue =>
            ['Done', 'Closed', 'Resolved'].includes(issue.fields.status?.statusCategory?.name) ||
            ['Done', 'Closed'].includes(issue.fields.status?.name)
        ).length;

        const toDoCount = linkedIssues.length - storyIssuesDone;

        return {
            story: {
                key: story.key,
                summary: story.fields.summary,
                status: story.fields.status?.name || "Unknown",
                statusCategory: story.fields.status?.statusCategory?.key || null,
                dueDate: story.fields.duedate || null
            },
            linkedIssues: linkedIssues.map(issue => ({
                key: issue.key,
                summary: issue.fields.summary,
                assignee: issue.fields.assignee?.displayName || null,
                storyPoints: issue.fields[CUSTOM_FIELDS.STORY_POINTS] || null,
                sprint: getNewestSprintName(issue.fields[CUSTOM_FIELDS.SPRINT]),
                status: issue.fields.status?.name || "",
                type: issue.fields.issuetype?.name || "",
                linkRelation: issue.linkInfo?.relation || "",
                linkType: issue.linkInfo?.linkType || "",
                allLinkTypes: issue.linkInfo?.allTypes || [],
                dueDate: issue.fields.duedate || null
            })),
            toDoCount
        };
    });

    storyData.sort((a, b) => b.toDoCount - a.toDoCount);

    // Calculate health
    let health = 'On Track';
    // Use custom end date field if available, otherwise fall back to duedate
    const endDateField = epic.fields[CUSTOM_FIELDS.EPIC_END_DATE] || epic.fields.duedate;
    const dueDate = endDateField ? new Date(endDateField) : null;
    const now = new Date();
    const progress = totalIssues > 0 ? Math.round((issuesDone / totalIssues) * 100) : 0;

    if (dueDate) {
        if (progress < 100 && dueDate < now) {
            health = 'Late';
        } else if (progress < 80 && (dueDate - now) < (7 * 24 * 60 * 60 * 1000)) { // Less than 80% done and due within 7 days
            health = 'At Risk';
        }
    }

    // Determine start date: use explicit start date field, or fall back to earliest child creation
    const startDateField = epic.fields[CUSTOM_FIELDS.EPIC_START_DATE];
    const startDate = startDateField || (earliestChildCreated ? earliestChildCreated.toISOString().split('T')[0] : null);

    // Extract dependencies (only to other epics within the same program)
    const { blockedBy, blocks } = extractDependencies(epic, programEpicKeys);

    // Calculate done counts for summary display
    const doneStories = stories.filter(s => s.fields.status?.statusCategory?.key === 'done').length;
    const doneTasks = tasks.filter(t => t.fields.status?.statusCategory?.key === 'done').length;

    return {
        epicKey: epic.key,
        epicSummary: epic.fields.summary,
        epicStatus: epic.fields.status?.name,
        dueDate: endDateField || null,
        startDate,
        progress,
        totalStories: stories.length,
        totalTasks: tasks.length,
        doneStories,
        doneTasks,
        totalIssues,
        issuesDone,
        health,
        storyPointsTotal,
        storyPointsCompleted,
        assignees: Array.from(assigneesSet),
        blockedBy,
        blocks,
        stories: storyData
    };
}

/**
 * Core logic to breakdown a single Epic
 * Returns breakdown data + statistics for progress
 * @deprecated Use processEpicData with batch data for better performance
 */
async function fetchEpicData(epic, programEpicKeys = new Set()) {
    const epicKey = epic.key;

    // Fetch all Stories
    const stories = await getAllJiraIssues(`parent = ${epicKey} AND issuetype = Story`);

    // Fetch all Tasks (direct children that are Tasks)
    const tasks = await getAllJiraIssues(`parent = ${epicKey} AND issuetype = Task`);

    // Combine stories and tasks for processing
    const allChildren = [...stories, ...tasks];

    // Track all counted issue keys to avoid duplicates
    const countedIssueKeys = new Set();

    let totalIssues = 0;
    let issuesDone = 0;
    let storyPointsTotal = 0;
    let storyPointsCompleted = 0;
    const assigneesSet = new Set();
    let earliestChildCreated = null;

    // Process direct children (Stories + Tasks)
    allChildren.forEach(child => {
        // Skip if already counted (shouldn't happen for direct children, but safety check)
        if (countedIssueKeys.has(child.key)) return;
        countedIssueKeys.add(child.key);

        totalIssues++;

        const createdDate = child.fields.created ? new Date(child.fields.created) : null;
        if (createdDate && (!earliestChildCreated || createdDate < earliestChildCreated)) {
            earliestChildCreated = createdDate;
        }
        // Collect assignees
        if (child.fields.assignee?.displayName) {
            assigneesSet.add(child.fields.assignee.displayName);
        }
        // Collect story points from direct children
        const childPoints = child.fields[CUSTOM_FIELDS.STORY_POINTS] || 0;
        storyPointsTotal += childPoints;
        if (child.fields.status?.statusCategory?.key === 'done') {
            storyPointsCompleted += childPoints;
            issuesDone++;
        }
    });

    // Detailed breakdown for stories (fetch linked issues for display, but deduplicate for counting)
    const storyData = await Promise.all(
        stories.map(async (story) => {
            const linkedIssues = await getLinkedIssuesForStory(story);

            // Process linked issues, but only count if not already counted
            linkedIssues.forEach(issue => {
                if (countedIssueKeys.has(issue.key)) return; // Skip duplicates
                countedIssueKeys.add(issue.key);

                totalIssues++;

                // Collect assignees from linked issues
                if (issue.fields.assignee?.displayName) {
                    assigneesSet.add(issue.fields.assignee.displayName);
                }
                // Collect story points from linked issues
                const points = issue.fields[CUSTOM_FIELDS.STORY_POINTS] || 0;
                storyPointsTotal += points;

                const isDone = ['Done', 'Closed', 'Resolved'].includes(issue.fields.status?.statusCategory?.name) ||
                    ['Done', 'Closed'].includes(issue.fields.status?.name);
                if (isDone) {
                    storyPointsCompleted += points;
                    issuesDone++;
                }

                // Track earliest creation date
                const createdDate = issue.fields.created ? new Date(issue.fields.created) : null;
                if (createdDate && (!earliestChildCreated || createdDate < earliestChildCreated)) {
                    earliestChildCreated = createdDate;
                }
            });

            const storyIssuesDone = linkedIssues.filter(issue =>
                ['Done', 'Closed', 'Resolved'].includes(issue.fields.status?.statusCategory?.name) ||
                ['Done', 'Closed'].includes(issue.fields.status?.name)
            ).length;

            const toDoCount = linkedIssues.length - storyIssuesDone;

            return {
                story: {
                    key: story.key,
                    summary: story.fields.summary,
                    status: story.fields.status?.name || "Unknown",
                    statusCategory: story.fields.status?.statusCategory?.key || null,
                    dueDate: story.fields.duedate || null
                },
                linkedIssues: linkedIssues.map(issue => ({
                    key: issue.key,
                    summary: issue.fields.summary,
                    assignee: issue.fields.assignee?.displayName || null,
                    storyPoints: issue.fields[CUSTOM_FIELDS.STORY_POINTS] || null,
                    sprint: getNewestSprintName(issue.fields[CUSTOM_FIELDS.SPRINT]),
                    status: issue.fields.status?.name || "",
                    type: issue.fields.issuetype?.name || "",
                    linkRelation: issue.linkInfo?.relation || "",
                    linkType: issue.linkInfo?.linkType || "",
                    allLinkTypes: issue.linkInfo?.allTypes || [],
                    dueDate: issue.fields.duedate || null
                })),
                toDoCount
            };
        })
    );

    storyData.sort((a, b) => b.toDoCount - a.toDoCount);

    // Calculate health
    let health = 'On Track';
    // Use custom end date field if available, otherwise fall back to duedate
    const endDateField = epic.fields[CUSTOM_FIELDS.EPIC_END_DATE] || epic.fields.duedate;
    const dueDate = endDateField ? new Date(endDateField) : null;
    const now = new Date();
    const progress = totalIssues > 0 ? Math.round((issuesDone / totalIssues) * 100) : 0;

    if (dueDate) {
        if (progress < 100 && dueDate < now) {
            health = 'Late';
        } else if (progress < 80 && (dueDate - now) < (7 * 24 * 60 * 60 * 1000)) { // Less than 80% done and due within 7 days
            health = 'At Risk';
        }
    }

    // Determine start date: use explicit start date field, or fall back to earliest child creation
    const startDateField = epic.fields[CUSTOM_FIELDS.EPIC_START_DATE];
    const startDate = startDateField || (earliestChildCreated ? earliestChildCreated.toISOString().split('T')[0] : null);

    // Extract dependencies (only to other epics within the same program)
    const { blockedBy, blocks } = extractDependencies(epic, programEpicKeys);

    // Calculate done counts for summary display
    const doneStories = stories.filter(s => s.fields.status?.statusCategory?.key === 'done').length;
    const doneTasks = tasks.filter(t => t.fields.status?.statusCategory?.key === 'done').length;

    return {
        epicKey: epic.key,
        epicSummary: epic.fields.summary,
        epicStatus: epic.fields.status?.name,
        dueDate: endDateField || null,
        startDate,
        progress,
        totalStories: stories.length,
        totalTasks: tasks.length,
        doneStories,
        doneTasks,
        totalIssues,
        issuesDone,
        health,
        storyPointsTotal,
        storyPointsCompleted,
        assignees: Array.from(assigneesSet),
        blockedBy,
        blocks,
        stories: storyData
    };
}

/**
 * Resolver: Search for Programs (Issues)
 */
resolver.define('searchPrograms', async ({ payload }) => {
    const { query } = payload;
    if (!query || query.length < 2) return [];

    // Fuzzy search for issues that could be programs
    // Prioritize "Program" type if user has it, but general search otherwise
    // Search for generic "Task", "Epic", "Initiative", "Program"
    // Search by key exactly or fuzzy summary
    // Priority logic in JQL: key match comes first in many Jira setups, but we can combine
    const jql = `key = "${query.toUpperCase()}" OR summary ~ "${query}*" ORDER BY created DESC`;

    const response = await api.asUser().requestJira(
        route`/rest/api/3/search/jql`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jql,
                fields: ['summary', 'issuetype', 'status'],
                maxResults: 20
            })
        }
    );

    if (!response.ok) return [];
    const data = await response.json();

    return (data.issues || []).map(issue => ({
        label: `${issue.key} - ${issue.fields.summary} (${issue.fields.issuetype?.name})`,
        value: issue.key,
        summary: issue.fields.summary,
        type: issue.fields.issuetype?.name
    }));
});

/**
 * Generate program report data (used by both cached and non-cached paths)
 */
async function generateProgramReport(programKey) {
    console.log('Generating report for Program:', programKey);

    // 1. Fetch Program Issue
    const programRes = await fetchWithRetry(() =>
        api.asUser().requestJira(route`/rest/api/3/issue/${programKey}?fields=summary,issuelinks,subtasks`)
    );
    const programIssue = await programRes.json();

    // 2. Identify Linked Epics
    const linkedKeys = new Set();

    (programIssue.fields.issuelinks || []).forEach(link => {
        if (link.outwardIssue) linkedKeys.add(link.outwardIssue.key);
        if (link.inwardIssue) linkedKeys.add(link.inwardIssue.key);
    });

    // Also check if there are child issues
    const childIssues = await getAllJiraIssues(`parent = ${programKey} AND issuetype = Epic`);
    childIssues.forEach(i => linkedKeys.add(i.key));

    if (linkedKeys.size === 0) {
        return {
            program: {
                key: programIssue.key,
                summary: programIssue.fields.summary
            },
            summary: {
                totalEpics: 0,
                totalStories: 0,
                totalTasks: 0,
                completedEpics: 0,
                completedStories: 0,
                completedTasks: 0,
                totalStoryPoints: 0,
                completedStoryPoints: 0,
                healthCounts: { onTrack: 0, atRisk: 0, late: 0 },
                overdueCount: 0,
                dueThisWeek: [],
                dueNextTwoWeeks: []
            },
            epics: []
        };
    }

    // 3. Fetch Details of these Linked Epics
    const jql = `key IN (${Array.from(linkedKeys).map(k => `"${k}"`).join(',')}) AND issuetype = Epic`;
    const epics = await getAllJiraIssues(jql);
    const programEpicKeys = new Set(epics.map(e => e.key));

    // 4. OPTIMIZED: Batch fetch all children for all epics at once
    // Build epic keys string for batch queries
    const epicKeysString = epics.map(e => e.key).join(',');

    // Fetch all stories and tasks for all epics in two queries instead of 2*N queries
    const allStories = await getAllJiraIssues(`parent IN (${epicKeysString}) AND issuetype = Story`);
    const allTasks = await getAllJiraIssues(`parent IN (${epicKeysString}) AND issuetype = Task`);

    // Group by parent epic
    const storiesByEpic = new Map();
    const tasksByEpic = new Map();

    allStories.forEach(story => {
        const parentKey = story.fields.parent?.key;
        if (parentKey) {
            if (!storiesByEpic.has(parentKey)) storiesByEpic.set(parentKey, []);
            storiesByEpic.get(parentKey).push(story);
        }
    });

    allTasks.forEach(task => {
        const parentKey = task.fields.parent?.key;
        if (parentKey) {
            if (!tasksByEpic.has(parentKey)) tasksByEpic.set(parentKey, []);
            tasksByEpic.get(parentKey).push(task);
        }
    });

    // 5. OPTIMIZED: Batch fetch all linked issues across all stories at once
    const { issueMap, globalLinkMap } = await batchFetchLinkedIssues(allStories);

    // 6. Process each epic using pre-fetched data
    const epicsData = epics.map(epic => {
        const stories = storiesByEpic.get(epic.key) || [];
        const tasks = tasksByEpic.get(epic.key) || [];
        return processEpicData(epic, stories, tasks, issueMap, globalLinkMap, programEpicKeys);
    });

    // 7. Calculate Summary Metrics
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    let totalStories = 0;
    let totalTasks = 0;
    let completedStories = 0;
    let completedTasks = 0;
    let totalStoryPoints = 0;
    let completedStoryPoints = 0;
    const healthCounts = { onTrack: 0, atRisk: 0, late: 0 };
    let overdueCount = 0;
    const dueThisWeek = [];
    const dueNextTwoWeeks = [];

    epicsData.forEach(epic => {
        totalStories += epic.totalStories;
        totalTasks += epic.totalTasks || 0;
        completedStories += epic.doneStories;
        completedTasks += epic.doneTasks || 0;
        totalStoryPoints += epic.storyPointsTotal || 0;
        completedStoryPoints += epic.storyPointsCompleted || 0;

        if (epic.health === 'On Track') healthCounts.onTrack++;
        else if (epic.health === 'At Risk') healthCounts.atRisk++;
        else if (epic.health === 'Late') healthCounts.late++;

        if (epic.dueDate) {
            const dueDate = new Date(epic.dueDate);
            if (dueDate < now && epic.progress < 100) {
                overdueCount++;
            } else if (dueDate >= now && dueDate <= oneWeekFromNow) {
                dueThisWeek.push({ key: epic.epicKey, summary: epic.epicSummary, dueDate: epic.dueDate });
            } else if (dueDate > oneWeekFromNow && dueDate <= twoWeeksFromNow) {
                dueNextTwoWeeks.push({ key: epic.epicKey, summary: epic.epicSummary, dueDate: epic.dueDate });
            }
        }
    });

    const completedEpics = epicsData.filter(e => e.progress === 100).length;

    return {
        program: {
            key: programIssue.key,
            summary: programIssue.fields.summary
        },
        summary: {
            totalEpics: epicsData.length,
            totalStories,
            totalTasks,
            completedEpics,
            completedStories,
            completedTasks,
            totalStoryPoints,
            completedStoryPoints,
            healthCounts,
            overdueCount,
            dueThisWeek,
            dueNextTwoWeeks
        },
        epics: epicsData
    };
}

/**
 * Get cached program report or generate fresh one
 */
async function getCachedProgramReport(programKey, forceRefresh = false) {
    const cacheKey = `program-report-${programKey}`;

    if (!forceRefresh) {
        try {
            const cached = await storage.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
                console.log(`Cache hit for ${programKey}, age: ${(Date.now() - cached.timestamp) / 1000}s`);
                return { ...cached.data, fromCache: true, cacheAge: Date.now() - cached.timestamp };
            }
        } catch (error) {
            console.log('Cache read error (non-fatal):', error.message);
        }
    }

    console.log(`Cache miss for ${programKey}, generating fresh report`);
    const data = await generateProgramReport(programKey);

    try {
        await storage.set(cacheKey, { data, timestamp: Date.now() });
        console.log(`Cache updated for ${programKey}`);
    } catch (error) {
        console.log('Cache write error (non-fatal):', error.message);
    }

    return { ...data, fromCache: false };
}

/**
 * Resolver: Get Full Program Report
 */
resolver.define('getProgramReport', async ({ payload }) => {
    const { programKey, forceRefresh } = payload;
    return getCachedProgramReport(programKey, forceRefresh);
});

export const handler = resolver.getDefinitions();
