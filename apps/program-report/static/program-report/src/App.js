import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { invoke, router, view } from '@forge/bridge';
import AsyncSelect from '@atlaskit/select/AsyncSelect';
import Select from '@atlaskit/select';
import Spinner from '@atlaskit/spinner';
import ProgressBar from '@atlaskit/progress-bar';
import Button, { ButtonGroup } from '@atlaskit/button';
import Textfield from '@atlaskit/textfield';
import { Checkbox } from '@atlaskit/checkbox';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import SectionMessage from '@atlaskit/section-message';
import Lozenge from '@atlaskit/lozenge';
import Badge from '@atlaskit/badge';
import Tooltip from '@atlaskit/tooltip';
import { DatePicker } from '@atlaskit/datetime-picker';
import './App.css';

// Debounce helper
const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

// Date formatting helper - Returns "Jan 15, 2026" format
const formatPreciseDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
};

// Calculate duration in days between two dates
const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// Due Date filter options
const DUE_DATE_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Due This Week', value: 'thisWeek' },
    { label: 'Due This Month', value: 'thisMonth' },
    { label: 'No Due Date', value: 'noDueDate' }
];

// Sort options
const SORT_OPTIONS = [
    { label: 'Due Date (Earliest)', value: 'dueDate-asc' },
    { label: 'Due Date (Latest)', value: 'dueDate-desc' },
    { label: 'Progress (Low to High)', value: 'progress-asc' },
    { label: 'Progress (High to Low)', value: 'progress-desc' },
    { label: 'Name (A-Z)', value: 'name-asc' },
    { label: 'Name (Z-A)', value: 'name-desc' }
];

// Summary Dashboard Component
const SummaryDashboard = ({ summary, onEpicClick }) => {
    if (!summary) return null;

    const completionPercent = summary.totalEpics > 0
        ? Math.round((summary.completedEpics / summary.totalEpics) * 100)
        : 0;

    const pointsPercent = summary.totalStoryPoints > 0
        ? Math.round((summary.completedStoryPoints / summary.totalStoryPoints) * 100)
        : 0;

    return (
        <div className="summary-dashboard">
            {/* Total Counts Card */}
            <div className="summary-card">
                <div className="summary-card-label">Total Counts</div>
                <div className="summary-card-value">{summary.totalEpics}</div>
                <div className="summary-card-subvalue">
                    Epics <Badge appearance="default">{summary.totalStories} Stories</Badge>{' '}
                    <Badge appearance="default">{summary.totalTasks} Tasks</Badge>
                </div>
            </div>

            {/* Completion Card */}
            <div className="summary-card">
                <div className="summary-card-label">Completion</div>
                <div className="summary-card-value">{completionPercent}%</div>
                <div className="summary-card-subvalue">
                    <Lozenge appearance="success">{summary.completedEpics}/{summary.totalEpics} Epics</Lozenge>
                </div>
            </div>

            {/* Story Points Card */}
            <div className="summary-card">
                <div className="summary-card-label">Story Points</div>
                <div className="summary-card-value">{summary.completedStoryPoints}/{summary.totalStoryPoints}</div>
                <div style={{ marginTop: '8px', width: '100%' }}>
                    <ProgressBar value={pointsPercent / 100} />
                </div>
            </div>

            {/* Health Distribution Card */}
            <div className="summary-card">
                <div className="summary-card-label">Health Distribution</div>
                <div className="health-distribution">
                    <Tooltip content="Epics on track">
                        <span className="health-item">
                            <Lozenge appearance="success">{summary.healthCounts.onTrack} On Track</Lozenge>
                        </span>
                    </Tooltip>
                    <Tooltip content="Epics at risk">
                        <span className="health-item">
                            <Lozenge appearance="moved">{summary.healthCounts.atRisk} At Risk</Lozenge>
                        </span>
                    </Tooltip>
                    <Tooltip content="Late epics">
                        <span className="health-item">
                            <Lozenge appearance="removed">{summary.healthCounts.late} Late</Lozenge>
                        </span>
                    </Tooltip>
                </div>
            </div>

            {/* Overdue Alert */}
            {summary.overdueCount > 0 && (
                <div className="summary-card-wide">
                    <SectionMessage appearance="error" title={`${summary.overdueCount} Overdue Epic${summary.overdueCount > 1 ? 's' : ''}`}>
                        <p>There are epics past their due date that need attention.</p>
                    </SectionMessage>
                </div>
            )}

            {/* Timeline Alerts */}
            {(summary.dueThisWeek.length > 0 || summary.dueNextTwoWeeks.length > 0) && (
                <div className="summary-card-wide">
                    <SectionMessage appearance="warning" title="Upcoming Deadlines">
                        {summary.dueThisWeek.length > 0 && (
                            <p>
                                <strong>{summary.dueThisWeek.length}</strong> due this week:{' '}
                                {summary.dueThisWeek.slice(0, 3).map((item, i) => (
                                    <span key={item.key}>
                                        {i > 0 && ', '}
                                        <a href="#" onClick={(e) => { e.preventDefault(); onEpicClick(item.key); }}>
                                            {item.key}
                                        </a>
                                    </span>
                                ))}
                                {summary.dueThisWeek.length > 3 && ` +${summary.dueThisWeek.length - 3} more`}
                            </p>
                        )}
                        {summary.dueNextTwoWeeks.length > 0 && (
                            <p><strong>{summary.dueNextTwoWeeks.length}</strong> due in the next 2 weeks</p>
                        )}
                    </SectionMessage>
                </div>
            )}
        </div>
    );
};

// Filter Panel Component
const FilterPanel = ({ filters, onFilterChange }) => {
    return (
        <div className="filter-panel">
            <div className="filter-group">
                <span className="filter-label">Health</span>
                <div className="filter-checkboxes">
                    <Checkbox
                        isChecked={filters.health.onTrack}
                        onChange={() => onFilterChange('health', 'onTrack')}
                        label="On Track"
                    />
                    <Checkbox
                        isChecked={filters.health.atRisk}
                        onChange={() => onFilterChange('health', 'atRisk')}
                        label="At Risk"
                    />
                    <Checkbox
                        isChecked={filters.health.late}
                        onChange={() => onFilterChange('health', 'late')}
                        label="Late"
                    />
                </div>
            </div>

            <div className="filter-group">
                <span className="filter-label">Due Date</span>
                <div style={{ minWidth: '160px' }}>
                    <Select
                        options={DUE_DATE_OPTIONS}
                        value={DUE_DATE_OPTIONS.find(opt => opt.value === filters.dueDate)}
                        onChange={(opt) => onFilterChange('dueDate', opt.value)}
                        isSearchable={false}
                        spacing="compact"
                    />
                </div>
            </div>

            <div className="filter-group">
                <span className="filter-label">Sort By</span>
                <div style={{ minWidth: '180px' }}>
                    <Select
                        options={SORT_OPTIONS}
                        value={SORT_OPTIONS.find(opt => opt.value === filters.sortBy)}
                        onChange={(opt) => onFilterChange('sortBy', opt.value)}
                        isSearchable={false}
                        spacing="compact"
                    />
                </div>
            </div>

            <div className="filter-group filter-search">
                <span className="filter-label">Search</span>
                <Textfield
                    placeholder="Search epics..."
                    value={filters.search}
                    onChange={(e) => onFilterChange('search', e.target.value)}
                    isCompact
                    width="200"
                />
            </div>
        </div>
    );
};

// Timeline constants
const TIMELINE_CONSTANTS = {
    LABEL_WIDTH: 240,
    ROW_HEIGHT: 56,
    SCALE_HEIGHT: 48,
    BAR_HEIGHT: 32,
    TOOLTIP_WIDTH: 340
};

// Table Timeline View Component
const TableTimelineView = ({ epics, onEpicClick }) => {
    const [sortConfig, setSortConfig] = useState({ key: 'startDate', direction: 'asc' });

    const sortedEpics = useMemo(() => {
        const sorted = [...epics];
        sorted.sort((a, b) => {
            let aVal, bVal;

            switch (sortConfig.key) {
                case 'epic':
                    aVal = a.epicKey;
                    bVal = b.epicKey;
                    break;
                case 'startDate':
                    aVal = a.startDate ? new Date(a.startDate).getTime() : Infinity;
                    bVal = b.startDate ? new Date(b.startDate).getTime() : Infinity;
                    break;
                case 'dueDate':
                    aVal = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                    bVal = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                    break;
                case 'duration':
                    aVal = calculateDuration(a.startDate, a.dueDate) || 0;
                    bVal = calculateDuration(b.startDate, b.dueDate) || 0;
                    break;
                case 'progress':
                    aVal = a.progress;
                    bVal = b.progress;
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [epics, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) return ' ↕';
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    };

    const getHealthClass = (epic) => {
        if (epic.progress === 100) return 'completed';
        switch (epic.health) {
            case 'On Track': return 'ontrack';
            case 'At Risk': return 'atrisk';
            case 'Late': return 'late';
            default: return 'ontrack';
        }
    };

    if (epics.length === 0) {
        return (
            <div className="table-timeline-container">
                <div className="empty-state" style={{ margin: 0 }}>
                    <div className="empty-state-icon">📅</div>
                    <div className="empty-state-title">No Timeline Data</div>
                    <p className="empty-state-message">Adjust filters or add epics with start/due dates to see the timeline.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="table-timeline-container">
            <div className="table-timeline-header">
                <h3 style={{ margin: 0 }}>Table Timeline View</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6B778C' }}>
                    Click column headers to sort. Precise dates displayed for accuracy.
                </p>
            </div>

            <div className="table-timeline-wrapper">
                <table className="table-timeline">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('epic')} style={{ cursor: 'pointer' }}>
                                Epic{getSortIcon('epic')}
                            </th>
                            <th onClick={() => requestSort('startDate')} style={{ cursor: 'pointer', width: '130px' }}>
                                Start Date{getSortIcon('startDate')}
                            </th>
                            <th onClick={() => requestSort('dueDate')} style={{ cursor: 'pointer', width: '130px' }}>
                                End Date{getSortIcon('dueDate')}
                            </th>
                            <th onClick={() => requestSort('duration')} style={{ cursor: 'pointer', width: '100px' }}>
                                Duration{getSortIcon('duration')}
                            </th>
                            <th style={{ width: '100px' }}>Health</th>
                            <th onClick={() => requestSort('progress')} style={{ cursor: 'pointer', width: '140px' }}>
                                Progress{getSortIcon('progress')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedEpics.map(epic => {
                            const duration = calculateDuration(epic.startDate, epic.dueDate);
                            const startFormatted = formatPreciseDate(epic.startDate);
                            const endFormatted = formatPreciseDate(epic.dueDate);

                            return (
                                <tr key={epic.epicKey}>
                                    <td className="table-timeline-epic">
                                        <a href="#" onClick={(e) => { e.preventDefault(); onEpicClick(epic.epicKey); }}>
                                            {epic.epicKey}
                                        </a>
                                        <div className="table-timeline-summary">{epic.epicSummary}</div>
                                    </td>
                                    <td className="table-timeline-date">
                                        {startFormatted || <span className="no-date">No Start Date</span>}
                                    </td>
                                    <td className="table-timeline-date">
                                        {endFormatted || <span className="no-date">No End Date</span>}
                                    </td>
                                    <td className="table-timeline-duration">
                                        {duration ? `${duration} day${duration !== 1 ? 's' : ''}` : '-'}
                                    </td>
                                    <td>
                                        <Lozenge appearance={
                                            epic.health === 'On Track' ? 'success' :
                                                epic.health === 'At Risk' ? 'moved' : 'removed'
                                        }>
                                            {epic.health}
                                        </Lozenge>
                                    </td>
                                    <td className="table-timeline-progress">
                                        <div className="progress-with-bar">
                                            <div className="mini-progress-bar">
                                                <div
                                                    className={`mini-progress-fill ${getHealthClass(epic)}`}
                                                    style={{ width: `${epic.progress}%` }}
                                                />
                                            </div>
                                            <span className="progress-text">{epic.progress}%</span>
                                            <span className="progress-details">({epic.issuesDone}/{epic.totalIssues})</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Enhanced Gantt Timeline View Component
const GanttTimelineView = ({ epics, onEpicClick }) => {
    const [zoom, setZoom] = useState('month');
    const [tooltip, setTooltip] = useState(null);
    const [showDateLabels, setShowDateLabels] = useState(true);
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [selectedEpicIndex, setSelectedEpicIndex] = useState(null);

    // Track container width for SVG calculations
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            const { width } = entries[0].contentRect;
            // Subtract only the label width. The flex container fills the rest.
            // Using Math.floor to ensure integer pixel values for sharper rendering
            setContainerWidth(Math.max(0, Math.floor(width - TIMELINE_CONSTANTS.LABEL_WIDTH)));
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!epics.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedEpicIndex(prev =>
                    prev === null ? 0 : Math.min(prev + 1, epics.length - 1)
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedEpicIndex(prev =>
                    prev === null ? 0 : Math.max(prev - 1, 0)
                );
            } else if (e.key === 'Enter' && selectedEpicIndex !== null) {
                router.open(`/browse/${epics[selectedEpicIndex].epicKey}`);
            } else if (e.key === 'Escape') {
                setSelectedEpicIndex(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedEpicIndex, epics]);

    // Filter epics by date range
    const filteredByDateRange = useMemo(() => {
        if (!dateRange.start && !dateRange.end) return epics;

        return epics.filter(epic => {
            if (!epic.startDate && !epic.dueDate) return true;

            const epicStart = epic.startDate ? new Date(epic.startDate) : null;
            const epicEnd = epic.dueDate ? new Date(epic.dueDate) : null;
            const rangeStart = dateRange.start ? new Date(dateRange.start) : null;
            const rangeEnd = dateRange.end ? new Date(dateRange.end) : null;

            // Check if epic overlaps with date range
            if (rangeStart && epicEnd && epicEnd < rangeStart) return false;
            if (rangeEnd && epicStart && epicStart > rangeEnd) return false;

            return true;
        });
    }, [epics, dateRange]);

    // CSV Export function
    const exportToCSV = useCallback(() => {
        const headers = ['Epic Key', 'Summary', 'Health', 'Status', 'Start Date', 'Due Date', 'Progress %', 'Story Points Done', 'Story Points Total', 'Issues Done', 'Total Issues'];
        const rows = filteredByDateRange.map(epic => [
            epic.epicKey,
            `"${epic.epicSummary.replace(/"/g, '""')}"`,
            epic.health,
            epic.epicStatus || '',
            epic.startDate || '',
            epic.dueDate || '',
            epic.progress,
            epic.storyPointsCompleted || 0,
            epic.storyPointsTotal || 0,
            epic.issuesDone || 0,
            epic.totalIssues || 0
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `program-timeline-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [filteredByDateRange]);

    // Debounced tooltip handler
    const handleBarHoverDebounced = useMemo(
        () => debounce((e, epic) => handleBarHover(e, epic), 50),
        []
    );

    const timelineRange = useMemo(() => {
        const epicsToUse = filteredByDateRange;
        if (epicsToUse.length === 0) return { start: new Date(), end: new Date(), scale: [] };

        const now = new Date();
        // Always include today in the range
        let minDate = now;
        let maxDate = now;

        epicsToUse.forEach(epic => {
            if (epic.startDate) {
                const start = new Date(epic.startDate);
                if (start < minDate) minDate = start;
            }
            if (epic.dueDate) {
                const end = new Date(epic.dueDate);
                if (end > maxDate) maxDate = end;
            }
        });

        // Helper: get Monday of the week for a given date
        const getMonday = (date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
            d.setDate(diff);
            d.setHours(0, 0, 0, 0);
            return d;
        };

        // Helper: get 1st of the month for a given date
        const getFirstOfMonth = (date) => {
            const d = new Date(date);
            d.setDate(1);
            d.setHours(0, 0, 0, 0);
            return d;
        };

        // Align dates based on zoom level
        if (zoom === 'week') {
            // Align to Mondays, with 1 week padding before and 2 weeks after
            minDate = getMonday(minDate);
            minDate.setDate(minDate.getDate() - 7); // 1 week before
            maxDate = getMonday(maxDate);
            maxDate.setDate(maxDate.getDate() + 14); // 2 weeks after

            // Ensure today is within range with some padding
            const todayMonday = getMonday(now);
            if (todayMonday < minDate) {
                minDate = new Date(todayMonday);
                minDate.setDate(minDate.getDate() - 7);
            }
            if (todayMonday > maxDate) {
                maxDate = new Date(todayMonday);
                maxDate.setDate(maxDate.getDate() + 14);
            }
        } else {
            // Align to 1st of month, with minimal padding
            minDate = getFirstOfMonth(minDate);
            maxDate = getFirstOfMonth(maxDate);
            // Add one month padding to give some breathing room
            maxDate.setMonth(maxDate.getMonth() + 1);

            // Ensure today is within range
            const todayMonth = getFirstOfMonth(now);
            if (todayMonth < minDate) {
                minDate = new Date(todayMonth);
            }
            if (todayMonth > maxDate) {
                maxDate = new Date(todayMonth);
                maxDate.setMonth(maxDate.getMonth() + 1);
            }
        }

        // Generate scale based on zoom level
        const scale = [];
        const current = new Date(minDate);

        while (current <= maxDate) {
            scale.push(new Date(current));
            if (zoom === 'week') {
                current.setDate(current.getDate() + 7);
            } else {
                current.setMonth(current.getMonth() + 1);
            }
        }

        // CRITICAL FIX: Set the end date to exactly one unit AFTER the last scale marker
        // This ensures that the mathematical range (0-100%) maps perfectly
        // to the visual columns (which will be flex: 1)
        const lastScaleDate = scale.length > 0 ? scale[scale.length - 1] : maxDate;
        const actualEnd = new Date(lastScaleDate);
        if (zoom === 'week') {
            actualEnd.setDate(actualEnd.getDate() + 7);
        } else {
            actualEnd.setMonth(actualEnd.getMonth() + 1);
        }

        return { start: minDate, end: actualEnd, scale };
    }, [filteredByDateRange, zoom]);

    const getPositionPercent = (date) => {
        if (!date) return 0;
        const d = new Date(date);
        const total = timelineRange.end.getTime() - timelineRange.start.getTime();
        const offset = d.getTime() - timelineRange.start.getTime();
        return Math.max(0, Math.min(100, (offset / total) * 100));
    };

    const formatScaleLabel = (date, index) => {
        if (zoom === 'week') {
            // For weekly view: Show "Week of Jan 6" or just month name at start of each month
            const endOfWeek = new Date(date);
            endOfWeek.setDate(endOfWeek.getDate() + 6);

            // Check if this is the first week of a month or first item
            const isFirstOfMonth = date.getDate() <= 7;
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            const day = date.getDate();

            if (index === 0 || isFirstOfMonth) {
                // Show month and day range for first week of month
                return `${month} ${day}`;
            }
            // For other weeks, just show the day number
            return `${day}`;
        }
        // Monthly view: Show full month and year (e.g., "Feb 2026")
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const getHealthClass = (epic) => {
        if (epic.progress === 100) return 'completed';
        switch (epic.health) {
            case 'On Track': return 'ontrack';
            case 'At Risk': return 'atrisk';
            case 'Late': return 'late';
            default: return 'ontrack';
        }
    };

    const handleBarHover = (e, epic) => {
        const rect = e.target.getBoundingClientRect();
        const tooltipWidth = TIMELINE_CONSTANTS.TOOLTIP_WIDTH;
        const tooltipHeight = 150; // Approximate height

        let x = rect.left + rect.width / 2;
        let y = rect.top - 10;
        let flipBelow = false;

        // Prevent horizontal overflow
        if (x + tooltipWidth / 2 > window.innerWidth) {
            x = window.innerWidth - tooltipWidth / 2 - 16;
        }
        if (x - tooltipWidth / 2 < 0) {
            x = tooltipWidth / 2 + 16;
        }

        // Flip below if not enough space above
        if (y - tooltipHeight < 0) {
            y = rect.bottom + 10;
            flipBelow = true;
        }

        setTooltip({ x, y, epic, flipBelow });
    };

    const todayPosition = getPositionPercent(new Date());

    const epicIndexMap = useMemo(() => {
        const map = {};
        filteredByDateRange.forEach((epic, index) => {
            map[epic.epicKey] = index;
        });
        return map;
    }, [filteredByDateRange]);

    if (filteredByDateRange.length === 0) {
        return (
            <div className="timeline-container">
                <div className="empty-state" style={{ margin: 0 }}>
                    <div className="empty-state-icon">📅</div>
                    <div className="empty-state-title">No Timeline Data</div>
                    <p className="empty-state-message">Adjust filters or add epics with start/due dates to see the timeline.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="timeline-container" ref={containerRef}>
            <div className="timeline-header">
                <div>
                    <h3 style={{ margin: 0 }}>Gantt Chart View</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6B778C' }}>
                        {zoom === 'week'
                            ? 'Each column represents one week. Hover bars for details. Gridlines help align dates.'
                            : 'Each column represents one month. Hover bars for details. Gridlines help align dates.'}
                    </p>
                </div>
                <div className="timeline-controls">
                    <div className="date-range-picker">
                        <DatePicker
                            value={dateRange.start}
                            onChange={(value) => setDateRange(prev => ({ ...prev, start: value }))}
                            placeholder="Start date"
                            spacing="compact"
                        />
                        <span>to</span>
                        <DatePicker
                            value={dateRange.end}
                            onChange={(value) => setDateRange(prev => ({ ...prev, end: value }))}
                            placeholder="End date"
                            spacing="compact"
                        />
                        {(dateRange.start || dateRange.end) && (
                            <Button
                                appearance="subtle"
                                spacing="compact"
                                onClick={() => setDateRange({ start: null, end: null })}
                            >
                                Reset
                            </Button>
                        )}
                    </div>
                    <ButtonGroup>
                        <Button
                            appearance={zoom === 'week' ? 'primary' : 'default'}
                            onClick={() => setZoom('week')}
                            spacing="compact"
                        >
                            Weekly
                        </Button>
                        <Button
                            appearance={zoom === 'month' ? 'primary' : 'default'}
                            onClick={() => setZoom('month')}
                            spacing="compact"
                        >
                            Monthly
                        </Button>
                    </ButtonGroup>
                    <Checkbox
                        isChecked={showDateLabels}
                        onChange={() => setShowDateLabels(!showDateLabels)}
                        label="Show date labels"
                    />
                    <Button
                        appearance="default"
                        spacing="compact"
                        onClick={exportToCSV}
                    >
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Visual Legend */}
            <div className="timeline-legend">
                <div className="legend-item">
                    <div className="legend-color ontrack" />
                    <span>On Track</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color atrisk" />
                    <span>At Risk</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color late" />
                    <span>Late</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color completed" />
                    <span>Completed</span>
                </div>
                <div className="legend-item" style={{ borderLeft: '1px solid #DFE1E6', paddingLeft: '16px', marginLeft: '8px' }}>
                    <div style={{ width: '2px', height: '16px', background: 'linear-gradient(180deg, #DE350B 0%, rgba(222, 53, 11, 0.3) 100%)' }} />
                    <span>Today</span>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#6B778C' }}>
                    {filteredByDateRange.length} epic{filteredByDateRange.length !== 1 ? 's' : ''}
                    {epics.length !== filteredByDateRange.length && ` (filtered from ${epics.length})`}
                </div>
            </div>

            <div className="timeline-wrapper">
                {/* Scale */}
                <div className="timeline-scale">
                    <div style={{ width: '240px', flexShrink: 0, fontWeight: 600, color: '#42526E', fontSize: '12px', paddingLeft: '8px' }}>Epic</div>
                    {timelineRange.scale.map((date, i) => {
                        const label = formatScaleLabel(date, i);
                        const isMonthStart = zoom === 'week' && (i === 0 || date.getDate() <= 7);
                        return (
                            <div
                                key={i}
                                className={`timeline-scale-item ${isMonthStart ? 'month-start' : ''}`}
                                style={{
                                    flex: 1,
                                    minWidth: 0, // Allow flex items to shrink if needed
                                    fontWeight: isMonthStart ? 600 : 400,
                                    // Ensure text doesn't overflow
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                                title={formatPreciseDate(date)}
                            >
                                {label}
                            </div>
                        );
                    })}
                </div>

                {/* Vertical gridlines */}
                {containerWidth > 0 && (
                    <svg className="timeline-gridlines" width={containerWidth} height={filteredByDateRange.length * TIMELINE_CONSTANTS.ROW_HEIGHT + 48}>
                        {timelineRange.scale.map((date, i) => {
                            const position = getPositionPercent(date);
                            const xPos = (position / 100) * containerWidth;
                            const isMonthStart = zoom === 'week' && (i === 0 || date.getDate() <= 7);
                            return (
                                <line
                                    key={i}
                                    x1={xPos}
                                    y1={48}
                                    x2={xPos}
                                    y2={filteredByDateRange.length * TIMELINE_CONSTANTS.ROW_HEIGHT + 48}
                                    className={`gridline ${isMonthStart ? 'gridline-major' : 'gridline-minor'}`}
                                />
                            );
                        })}
                    </svg>
                )}

                {/* Today line - positioned using JavaScript calculation */}
                {containerWidth > 0 && todayPosition >= 0 && todayPosition <= 100 && (
                    <div
                        className="timeline-today-line"
                        style={{ left: `${TIMELINE_CONSTANTS.LABEL_WIDTH + (todayPosition / 100) * containerWidth}px` }}
                    >
                        <div className="timeline-today-label">Today</div>
                    </div>
                )}

                {/* Epic rows */}
                <div className="timeline-rows" role="list" aria-label="Epic timeline">
                    {filteredByDateRange.map((epic, index) => {
                        const startPos = getPositionPercent(epic.startDate || epic.dueDate);
                        const endPos = getPositionPercent(epic.dueDate || epic.startDate);
                        const width = Math.max(2, endPos - startPos);
                        const isSelected = selectedEpicIndex === index;

                        return (
                            <div
                                key={epic.epicKey}
                                className={`timeline-row ${isSelected ? 'keyboard-selected' : ''}`}
                                role="listitem"
                                tabIndex={0}
                                onClick={() => setSelectedEpicIndex(index)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        router.open(`/browse/${epic.epicKey}`);
                                    }
                                }}
                            >
                                <div className="timeline-row-label">
                                    <a href="#" onClick={(e) => { e.preventDefault(); onEpicClick(epic.epicKey); }}>
                                        {epic.epicKey}
                                    </a>
                                    {' - '}
                                    {epic.epicSummary.length > 25 ? epic.epicSummary.substring(0, 25) + '...' : epic.epicSummary}
                                </div>
                                <div className="timeline-row-track">
                                    {(epic.startDate || epic.dueDate) && (
                                        <>
                                            <div
                                                className={`timeline-bar ${getHealthClass(epic)}`}
                                                style={{
                                                    left: `${startPos}%`,
                                                    width: `${width}%`
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`Epic ${epic.epicKey}: ${epic.epicSummary}. ${epic.progress}% complete. Status: ${epic.health}.`}
                                                onClick={() => router.open(`/browse/${epic.epicKey}`)}
                                                onMouseEnter={(e) => handleBarHoverDebounced(e, epic)}
                                                onMouseLeave={() => setTooltip(null)}
                                                onFocus={(e) => handleBarHover(e, epic)}
                                                onBlur={() => setTooltip(null)}
                                            >
                                                {/* Start date marker */}
                                                {showDateLabels && epic.startDate && (
                                                    <div className="timeline-date-marker start" title={formatPreciseDate(epic.startDate)} />
                                                )}

                                                {/* Progress bar */}
                                                <div
                                                    className="timeline-bar-progress"
                                                    style={{ width: `${epic.progress}%` }}
                                                />

                                                {/* Progress percentage */}
                                                {width > 8 && <span className="timeline-bar-text">{epic.progress}%</span>}

                                                {/* End date marker */}
                                                {showDateLabels && epic.dueDate && (
                                                    <div className="timeline-date-marker end" title={formatPreciseDate(epic.dueDate)} />
                                                )}
                                            </div>

                                            {/* Date labels below bar */}
                                            {showDateLabels && width > 15 && (
                                                <div className="timeline-date-labels">
                                                    {epic.startDate && (
                                                        <span className="timeline-date-label start" style={{ left: `${startPos}%` }}>
                                                            {formatPreciseDate(epic.startDate)}
                                                        </span>
                                                    )}
                                                    {epic.dueDate && (
                                                        <span className="timeline-date-label end" style={{ left: `${endPos}%` }}>
                                                            {formatPreciseDate(epic.dueDate)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Dependency arrows (SVG) */}
                {containerWidth > 0 && (
                    <svg
                        className="timeline-dependencies"
                        style={{ height: filteredByDateRange.length * TIMELINE_CONSTANTS.ROW_HEIGHT }}
                        width={containerWidth}
                        aria-hidden="true"
                    >
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#6B778C" />
                            </marker>
                        </defs>
                        {filteredByDateRange.map((epic, fromIndex) => (
                            epic.blocks && epic.blocks.map(blockedKey => {
                                const toIndex = epicIndexMap[blockedKey];
                                if (toIndex === undefined) return null;

                                const targetEpic = filteredByDateRange[toIndex];
                                if (!targetEpic) return null;

                                // Calculate pixel positions from percentages
                                const fromPercent = getPositionPercent(epic.dueDate);
                                const toPercent = getPositionPercent(targetEpic.startDate || targetEpic.dueDate);

                                const fromXPx = (fromPercent / 100) * containerWidth;
                                const toXPx = (toPercent / 100) * containerWidth;

                                const fromY = fromIndex * TIMELINE_CONSTANTS.ROW_HEIGHT + 24 + TIMELINE_CONSTANTS.BAR_HEIGHT;
                                const toY = toIndex * TIMELINE_CONSTANTS.ROW_HEIGHT + 24 + TIMELINE_CONSTANTS.BAR_HEIGHT;

                                // Calculate control points for smooth bezier curve
                                const controlOffset = Math.min(40, Math.abs(toXPx - fromXPx) / 3);

                                return (
                                    <path
                                        key={`${epic.epicKey}-${blockedKey}`}
                                        className="dependency-arrow"
                                        d={`M ${fromXPx} ${fromY} C ${fromXPx + controlOffset} ${fromY}, ${toXPx - controlOffset} ${toY}, ${toXPx} ${toY}`}
                                        markerEnd="url(#arrowhead)"
                                    />
                                );
                            })
                        ))}
                    </svg>
                )}
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="timeline-tooltip"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: tooltip.flipBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
                    }}
                >
                    <div className="timeline-tooltip-title">{tooltip.epic.epicKey}: {tooltip.epic.epicSummary}</div>
                    <div className="timeline-tooltip-dates">
                        {tooltip.epic.startDate && (
                            <div><strong>Start:</strong> {formatPreciseDate(tooltip.epic.startDate)}</div>
                        )}
                        {tooltip.epic.dueDate && (
                            <div><strong>End:</strong> {formatPreciseDate(tooltip.epic.dueDate)}</div>
                        )}
                        {tooltip.epic.startDate && tooltip.epic.dueDate && (
                            <div><strong>Duration:</strong> {calculateDuration(tooltip.epic.startDate, tooltip.epic.dueDate)} days</div>
                        )}
                    </div>
                    <div className="timeline-tooltip-info">
                        <div><strong>Status:</strong> {tooltip.epic.epicStatus}</div>
                        <div><strong>Health:</strong> {tooltip.epic.health}</div>
                        <div><strong>Progress:</strong> {tooltip.epic.progress}% ({tooltip.epic.issuesDone}/{tooltip.epic.totalIssues} issues)</div>
                        {tooltip.epic.blockedBy?.length > 0 && <div><strong>Blocked by:</strong> {tooltip.epic.blockedBy.join(', ')}</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

// Epic Card Component
const EpicCard = ({ epic, expanded, onToggle, formatDate, isOverdue, getRelativeDate }) => {
    const getHealthAppearance = (health) => {
        switch (health) {
            case 'On Track': return 'success';
            case 'At Risk': return 'moved';
            case 'Late': return 'removed';
            default: return 'default';
        }
    };

    const getStatusAppearance = (status) => {
        const s = (status || '').toLowerCase();
        if (s.includes('done') || s.includes('closed')) return 'success';
        if (s.includes('progress') || s.includes('review')) return 'inprogress';
        return 'default';
    };

    return (
        <div className="epic-card">
            <div className="epic-header" onClick={onToggle}>
                <div className="epic-title">
                    <a
                        href="#"
                        onClick={(e) => { e.stopPropagation(); router.open(`/browse/${epic.epicKey}`); }}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        {epic.epicKey} - {epic.epicSummary}
                    </a>
                </div>

                <div className="epic-meta">
                    <div className="meta-item">
                        <span className="meta-label">Status & Health</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Lozenge appearance={getStatusAppearance(epic.epicStatus)}>{epic.epicStatus || 'Unknown'}</Lozenge>
                            <Lozenge appearance={getHealthAppearance(epic.health)}>{epic.health}</Lozenge>
                        </div>
                    </div>

                    <div className="meta-item">
                        <span className="meta-label">Due Date</span>
                        <span className={`meta-value ${isOverdue(epic.dueDate) ? 'overdue' : ''}`}>
                            {formatDate(epic.dueDate)}
                            {epic.dueDate && <div style={{ fontSize: '10px', color: isOverdue(epic.dueDate) ? '#DE350B' : '#6B778C' }}>{getRelativeDate(epic.dueDate)}</div>}
                        </span>
                    </div>

                    <div className="meta-item">
                        <span className="meta-label">Story Points</span>
                        <span className="meta-value">
                            <Badge appearance="primary">{epic.storyPointsCompleted || 0}</Badge>
                            {' / '}
                            <Badge appearance="default">{epic.storyPointsTotal || 0}</Badge>
                        </span>
                    </div>

                    <div className="meta-item">
                        <span className="meta-label">Progress</span>
                        <div className="progress-container">
                            <ProgressBar value={epic.progress / 100} />
                        </div>
                        <span style={{ fontSize: '11px' }}>{epic.progress}% ({epic.issuesDone}/{epic.totalIssues})</span>
                    </div>

                    <Button appearance="subtle" spacing="compact">
                        {expanded ? 'Hide' : 'Show'}
                    </Button>
                </div>
            </div>

            {expanded && (
                <div className="details-section">
                    {epic.assignees?.length > 0 && (
                        <div style={{ marginBottom: '12px', fontSize: '12px', color: '#6B778C' }}>
                            <strong>Assignees:</strong> {epic.assignees.join(', ')}
                        </div>
                    )}
                    {(epic.blockedBy?.length > 0 || epic.blocks?.length > 0) && (
                        <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                            {epic.blockedBy?.length > 0 && (
                                <div style={{ marginBottom: '4px' }}>
                                    <Lozenge appearance="removed">Blocked by</Lozenge>{' '}
                                    {epic.blockedBy.map((k, i) => (
                                        <span key={k}>
                                            {i > 0 && ', '}
                                            <a href="#" onClick={(e) => { e.preventDefault(); router.open(`/browse/${k}`); }}>{k}</a>
                                        </span>
                                    ))}
                                </div>
                            )}
                            {epic.blocks?.length > 0 && (
                                <div>
                                    <Lozenge appearance="moved">Blocks</Lozenge>{' '}
                                    {epic.blocks.map((k, i) => (
                                        <span key={k}>
                                            {i > 0 && ', '}
                                            <a href="#" onClick={(e) => { e.preventDefault(); router.open(`/browse/${k}`); }}>{k}</a>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {epic.stories.map(storyData => (
                        <div key={storyData.story.key} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <strong>{storyData.story.key}</strong> {storyData.story.summary}
                                <Lozenge appearance={getStatusAppearance(storyData.story.status)}>{storyData.story.status}</Lozenge>
                                {storyData.story.dueDate && (
                                    <Badge appearance={isOverdue(storyData.story.dueDate) ? 'removed' : 'default'}>
                                        {formatDate(storyData.story.dueDate)}
                                    </Badge>
                                )}
                            </div>

                            {storyData.linkedIssues.length > 0 && (
                                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginLeft: '20px', tableLayout: 'fixed' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: '#666', borderBottom: '1px solid #eee' }}>
                                            <th style={{ padding: '8px 4px', width: '100px' }}>Key</th>
                                            <th style={{ padding: '8px 4px' }}>Summary</th>
                                            <th style={{ padding: '8px 4px', width: '120px' }}>Status</th>
                                            <th style={{ padding: '8px 4px', width: '100px' }}>Due</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {storyData.linkedIssues.map(task => (
                                            <tr key={task.key} style={{ borderBottom: '1px solid #f4f5f7' }}>
                                                <td style={{ padding: '8px 4px', width: '100px' }}>
                                                    <a href="#" onClick={() => router.open(`/browse/${task.key}`)}>{task.key}</a>
                                                </td>
                                                <td style={{ padding: '8px 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.summary}</td>
                                                <td style={{ padding: '8px 4px', width: '120px' }}>
                                                    <Lozenge appearance={getStatusAppearance(task.status)} isBold={false}>{task.status}</Lozenge>
                                                </td>
                                                <td style={{ padding: '8px 4px', width: '100px' }}>
                                                    {task.dueDate ? (
                                                        <span style={{ fontSize: '11px', color: isOverdue(task.dueDate) ? '#DE350B' : 'inherit' }}>
                                                            {formatDate(task.dueDate)}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Main App Component
const App = () => {
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedEpics, setExpandedEpics] = useState({});
    const [showInstructions, setShowInstructions] = useState(false);
    const [copyStatus, setCopyStatus] = useState('Copy Link');
    const [selectedTab, setSelectedTab] = useState(0);
    const [filters, setFilters] = useState({
        health: { onTrack: true, atRisk: true, late: true },
        dueDate: 'all',
        sortBy: 'dueDate-asc',
        search: ''
    });

    useEffect(() => {
        const checkParams = async () => {
            try {
                const context = await view.getContext();

                const urlParams = new URLSearchParams(window.location.search);
                const urlKey = urlParams.get('programKey');

                const contextKey = context?.extension?.queryParams?.programKey?.[0] ||
                    context?.extension?.parameters?.programKey;

                const locationKey = context?.extension?.location ? new URL(context.extension.location).searchParams.get('programKey') : null;

                const programKey = locationKey || contextKey || urlKey;
                if (programKey) {
                    loadReport(programKey);
                }
            } catch (err) {
                console.error('App: Failed to get context:', err);
            }
        };
        checkParams();
    }, []);

    useEffect(() => {
        if (reportData && (!selectedProgram || selectedProgram.value !== reportData.program.key)) {
            setSelectedProgram({
                value: reportData.program.key,
                label: `${reportData.program.key} - ${reportData.program.summary}`
            });
        }
    }, [reportData]);

    const loadProgramOptions = async (query) => {
        try {
            const results = await invoke('searchPrograms', { query });
            return results;
        } catch (err) {
            console.error('Search failed:', err);
            return [];
        }
    };

    const loadReport = async (programKey) => {
        setLoading(true);
        setReportData(null);
        try {
            const data = await invoke('getProgramReport', { programKey });
            setReportData(data);
        } catch (err) {
            console.error('App: Failed to load report:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleProgramSelect = (option) => {
        setSelectedProgram(option);
        if (option) {
            router.navigate(`?programKey=${option.value}`);
            loadReport(option.value);
        } else {
            router.navigate('');
            setReportData(null);
        }
    };

    const copyShareLink = async () => {
        try {
            const context = await view.getContext();
            const siteUrl = context.siteUrl;
            const appId = '34856d0e-df05-4602-942a-01493b8ab06d';
            const programKey = reportData.program.key;

            const envId = context.environmentId || context.environmentType || 'production';
            const shareableUrl = `${siteUrl}/jira/apps/${appId}/${envId}?programKey=${programKey}`;

            await navigator.clipboard.writeText(shareableUrl);
            setCopyStatus('Copied!');
            setTimeout(() => setCopyStatus('Copy Link'), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
            setCopyStatus('Error!');
            setTimeout(() => setCopyStatus('Copy Link'), 2000);
        }
    };

    const toggleEpic = (epicKey) => {
        setExpandedEpics(prev => ({ ...prev, [epicKey]: !prev[epicKey] }));
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => {
            if (filterType === 'health') {
                return {
                    ...prev,
                    health: { ...prev.health, [value]: !prev.health[value] }
                };
            }
            return { ...prev, [filterType]: value };
        });
    };

    // Filter and sort epics
    const filteredEpics = useMemo(() => {
        if (!reportData?.epics) return [];

        let result = reportData.epics.filter(epic => {
            // Health filter
            const healthKey = epic.health === 'On Track' ? 'onTrack' : (epic.health === 'At Risk' ? 'atRisk' : 'late');
            if (!filters.health[healthKey]) return false;

            // Due date filter
            if (filters.dueDate !== 'all') {
                const now = new Date();
                const dueDate = epic.dueDate ? new Date(epic.dueDate) : null;

                if (filters.dueDate === 'overdue' && (!dueDate || dueDate >= now)) return false;
                if (filters.dueDate === 'noDueDate' && dueDate) return false;
                if (filters.dueDate === 'thisWeek') {
                    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    if (!dueDate || dueDate < now || dueDate > weekFromNow) return false;
                }
                if (filters.dueDate === 'thisMonth') {
                    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    if (!dueDate || dueDate < now || dueDate > monthFromNow) return false;
                }
            }

            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                if (!epic.epicKey.toLowerCase().includes(searchLower) &&
                    !epic.epicSummary.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }

            return true;
        });

        // Sort
        const [sortField, sortDir] = filters.sortBy.split('-');
        result.sort((a, b) => {
            let comparison = 0;

            if (sortField === 'dueDate') {
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                comparison = dateA - dateB;
            } else if (sortField === 'progress') {
                comparison = a.progress - b.progress;
            } else if (sortField === 'name') {
                comparison = a.epicSummary.localeCompare(b.epicSummary);
            }

            return sortDir === 'desc' ? -comparison : comparison;
        });

        return result;
    }, [reportData, filters]);

    const formatDate = (dateStr) => {
        if (!dateStr) return 'No Date';
        return new Date(dateStr).toLocaleDateString();
    };

    const isOverdue = (dateStr) => {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date();
    };

    const getRelativeDate = (dateStr) => {
        if (!dateStr) return null;
        const target = new Date(dateStr);
        const now = new Date();
        const diffTime = target - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Due today";
        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
        return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} overdue`;
    };

    const handleEpicClick = (epicKey) => {
        router.open(`/browse/${epicKey}`);
    };

    return (
        <div className="app-container">
            <div className="header-section">
                <h1>Program Report</h1>
                <div className="header-subtitle">Track epic progress, timelines, and health across your program</div>

                <div className="instructions-card">
                    <div className="instructions-header" onClick={() => setShowInstructions(!showInstructions)}>
                        <h3 style={{ margin: 0 }}>How it works</h3>
                        <Button appearance="subtle" spacing="compact">{showInstructions ? 'Hide Guide' : 'Show Guide'}</Button>
                    </div>
                    {showInstructions && (
                        <div className="instruction-body">
                            <p><strong>Step 1: Create a Container</strong><br />
                                Create any Jira issue (e.g., a Task) named "Q1 Program". Link all your relevant <strong>Epics</strong> to this issue.</p>
                            <p><strong>Step 2: Search for the Container</strong><br />
                                Use the search bar below to find your container issue by <strong>Summary</strong> or <strong>Jira Key</strong>.</p>
                            <p><strong>Step 3: View Progress & Timelines</strong><br />
                                The report pulls all linked Epics, calculates their progress based on child stories, and highlights upcoming/overdue <strong>Due Dates</strong>.</p>
                        </div>
                    )}
                </div>

                <div className="search-container">
                    <label style={{ fontWeight: 600, marginBottom: '4px', display: 'block' }}>Select Program Issue</label>
                    <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={loadProgramOptions}
                        onChange={handleProgramSelect}
                        value={selectedProgram}
                        placeholder="Search for a program ticket (e.g., 'PROJ-123' or 'Roadmap')..."
                        noOptionsMessage={() => "Type to search issues..."}
                    />
                </div>
            </div>

            {loading && (
                <div className="loading-state">
                    <Spinner size="large" />
                    <span className="loading-state-text">Loading program data...</span>
                </div>
            )}

            {!loading && reportData && (
                <div className="report-content">
                    <div className="report-header">
                        <h2 className="report-title">
                            Report: {reportData.program.summary} <span className="report-title-key">({reportData.program.key})</span>
                        </h2>
                        <Button appearance="primary" onClick={copyShareLink}>
                            {copyStatus}
                        </Button>
                    </div>

                    {/* Summary Dashboard */}
                    <SummaryDashboard summary={reportData.summary} onEpicClick={handleEpicClick} />

                    {/* Filter Panel */}
                    <FilterPanel
                        filters={filters}
                        onFilterChange={handleFilterChange}
                    />

                    {/* Tabs for Cards/Timeline view */}
                    <Tabs onChange={setSelectedTab} selected={selectedTab}>
                        <TabList>
                            <Tab>Cards View</Tab>
                            <Tab>Timeline View</Tab>
                        </TabList>
                        <TabPanel>
                            <div className="epics-list" style={{ marginTop: '16px' }}>
                                {filteredEpics.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">
                                            {reportData.epics.length === 0 ? '🔗' : '🔍'}
                                        </div>
                                        <div className="empty-state-title">
                                            {reportData.epics.length === 0 ? 'No Linked Epics' : 'No Results Found'}
                                        </div>
                                        <p className="empty-state-message">
                                            {reportData.epics.length === 0
                                                ? "Link Epics to this program issue to start tracking progress."
                                                : "No epics match your current filters. Try adjusting the filters above."}
                                        </p>
                                    </div>
                                ) : (
                                    filteredEpics.map(epic => (
                                        <EpicCard
                                            key={epic.epicKey}
                                            epic={epic}
                                            expanded={expandedEpics[epic.epicKey]}
                                            onToggle={() => toggleEpic(epic.epicKey)}
                                            formatDate={formatDate}
                                            isOverdue={isOverdue}
                                            getRelativeDate={getRelativeDate}
                                        />
                                    ))
                                )}
                            </div>
                        </TabPanel>
                        <TabPanel>
                            <div style={{ marginTop: '16px' }}>
                                <Tabs>
                                    <TabList>
                                        <Tab>Gantt Chart</Tab>
                                        <Tab>Table View</Tab>
                                    </TabList>
                                    <TabPanel>
                                        <div style={{ marginTop: '16px' }}>
                                            <GanttTimelineView epics={filteredEpics} onEpicClick={handleEpicClick} />
                                        </div>
                                    </TabPanel>
                                    <TabPanel>
                                        <div style={{ marginTop: '16px' }}>
                                            <TableTimelineView epics={filteredEpics} onEpicClick={handleEpicClick} />
                                        </div>
                                    </TabPanel>
                                </Tabs>
                            </div>
                        </TabPanel>
                    </Tabs>
                </div>
            )}
        </div>
    );
};

export default App;
