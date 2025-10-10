// Configuration Validation Functions

function setupRealtimeValidation(editMode) {
    // Listen to all time and temperature inputs
    const allInputs = editMode.querySelectorAll('.interval-start-time, .interval-end-time, .interval-on-temp, .interval-off-temp');

    allInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Debounce validation slightly
            clearTimeout(input.validationTimeout);
            input.validationTimeout = setTimeout(() => {
                validateInRealtime(editMode);
            }, 300);
        });

        input.addEventListener('blur', function() {
            // Immediate validation on blur
            validateInRealtime(editMode);
        });
    });
}

function validateInRealtime(editMode) {
    // Clear all previous error states
    editMode.querySelectorAll('.day-edit-section').forEach(section => {
        section.classList.remove('has-error');
        const existingError = section.querySelector('.day-validation-error');
        if (existingError) {
            existingError.remove();
        }
    });

    editMode.querySelectorAll('.interval-edit-item').forEach(item => {
        item.classList.remove('has-error');
    });

    editMode.querySelectorAll('input').forEach(input => {
        input.classList.remove('error');
    });

    // Collect and validate data
    const updatedConfig = collectIntervalData(editMode);
    const error = validateConfigurationDetailed(updatedConfig, editMode);

    // No errors - all good!
    if (!error) {
        return true;
    }

    return false;
}

// Enhanced validation that marks specific fields with errors
function validateConfigurationDetailed(config, editMode) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (const day of days) {
        const intervals = config[day];
        const daySection = editMode.querySelector(`.day-edit-section[data-day="${day}"]`);

        // Rule 1: No empty intervals
        if (!intervals || intervals.length === 0) {
            markDayError(daySection, `Must have at least one interval`);
            return true;
        }

        // Rule 2: Check continuous coverage and wrap-around
        const firstStart = intervals[0].start_time.timestamp;
        const lastEnd = intervals[intervals.length - 1].end_time.timestamp;
        const expectedFirstStart = (lastEnd + 1) % (24 * 60);

        if (firstStart !== expectedFirstStart) {
            // Calculate what the last interval end should be
            const expectedLastEnd = (firstStart - 1 + 24 * 60) % (24 * 60);

            markDayError(daySection, `Must cover full 24 hours. Last interval should end at ${formatTimestamp(expectedLastEnd)}`);
            // Mark last interval as error
            const lastInterval = daySection.querySelector(`.interval-edit-item[data-index="${intervals.length - 1}"]`);
            if (lastInterval) {
                lastInterval.classList.add('has-error');
                lastInterval.querySelector('.interval-end-time').classList.add('error');
            }
            return true;
        }

        // Rule 3: Check continuity between intervals
        let midnightCrossings = 0;
        for (let i = 0; i < intervals.length; i++) {
            const current = intervals[i];
            const start = current.start_time.timestamp;
            const end = current.end_time.timestamp;

            // Check for midnight crossing
            if (start > end) {
                midnightCrossings++;
                if (midnightCrossings > 1) {
                    markDayError(daySection, `Only one interval can cross midnight`);
                    return true;
                }
            }

            // Check continuity with previous interval
            if (i > 0) {
                const prevEnd = intervals[i - 1].end_time.timestamp;
                const expectedStart = (prevEnd + 1) % (24 * 60);

                if (start !== expectedStart) {
                    markDayError(daySection, `Gap between intervals. This interval should start at ${formatTimestamp(expectedStart)}`);
                    // Mark the problematic interval
                    const intervalItem = daySection.querySelector(`.interval-edit-item[data-index="${i}"]`);
                    if (intervalItem) {
                        intervalItem.classList.add('has-error');
                        intervalItem.querySelector('.interval-start-time').classList.add('error');
                    }
                    return true;
                }
            }
        }
    }

    return false; // No errors
}

function markDayError(daySection, message) {
    daySection.classList.add('has-error');

    // Add error message if not already present
    if (!daySection.querySelector('.day-validation-error')) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'day-validation-error';
        errorDiv.textContent = message;
        daySection.querySelector('.intervals-edit').insertAdjacentElement('afterend', errorDiv);
    }
}

// Validate configuration following backend rules
function validateConfiguration(config) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (const day of days) {
        const intervals = config[day];

        // Rule 1: No empty intervals
        if (!intervals || intervals.length === 0) {
            return `${day.charAt(0).toUpperCase() + day.slice(1)} must have at least one interval`;
        }

        // Rule 2: Check continuous coverage and wrap-around
        const firstStart = intervals[0].start_time.timestamp;
        const lastEnd = intervals[intervals.length - 1].end_time.timestamp;
        const expectedFirstStart = (lastEnd + 1) % (24 * 60);

        if (firstStart !== expectedFirstStart) {
            return `${day.charAt(0).toUpperCase() + day.slice(1)}: Intervals must cover full 24 hours with no gaps. First interval should start at ${formatTimestamp(expectedFirstStart)}, but starts at ${formatTimestamp(firstStart)}`;
        }

        // Rule 3: Check continuity between intervals
        let midnightCrossings = 0;
        for (let i = 0; i < intervals.length; i++) {
            const current = intervals[i];
            const start = current.start_time.timestamp;
            const end = current.end_time.timestamp;

            // Check for midnight crossing
            if (start > end) {
                midnightCrossings++;
                if (midnightCrossings > 1) {
                    return `${day.charAt(0).toUpperCase() + day.slice(1)}: Only one interval per day can cross midnight`;
                }
            }

            // Check continuity with previous interval
            if (i > 0) {
                const prevEnd = intervals[i - 1].end_time.timestamp;
                const expectedStart = (prevEnd + 1) % (24 * 60);

                if (start !== expectedStart) {
                    return `${day.charAt(0).toUpperCase() + day.slice(1)}: Gap between intervals ${i} and ${i + 1}. Interval ${i + 1} should start at ${formatTimestamp(expectedStart)}, but starts at ${formatTimestamp(start)}`;
                }
            }
        }
    }

    return null; // No errors
}

// Collect all interval data from the edit mode form
function collectIntervalData(editMode) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const config = {};

    days.forEach(day => {
        const daySection = editMode.querySelector(`.day-edit-section[data-day="${day}"]`);
        const intervalItems = daySection.querySelectorAll('.interval-edit-item');

        config[day] = [];
        intervalItems.forEach(item => {
            const startTime = item.querySelector('.interval-start-time').value;
            const endTime = item.querySelector('.interval-end-time').value;
            const onTemp = parseFloat(item.querySelector('.interval-on-temp').value);
            const offTemp = parseFloat(item.querySelector('.interval-off-temp').value);

            const start = parseTimeInput(startTime);
            const end = parseTimeInput(endTime);

            config[day].push({
                start_time: { hour: start.hour, minute: start.minute, timestamp: start.timestamp },
                end_time: { hour: end.hour, minute: end.minute, timestamp: end.timestamp },
                ON_temperature: onTemp,
                OFF_temperature: offTemp
            });
        });
    });

    return config;
}

// Utility: Calculate timestamp from hour and minute
function calculateTimestamp(hour, minute) {
    return hour * 60 + minute;
}

// Utility: Parse time input (HH:MM) to hour and minute
function parseTimeInput(timeString) {
    const [hour, minute] = timeString.split(':').map(Number);
    return { hour, minute, timestamp: calculateTimestamp(hour, minute) };
}

// Format timestamp (minutes from midnight) to HH:MM
function formatTimestamp(timestamp) {
    const hour = Math.floor(timestamp / 60);
    const minute = timestamp % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
