import React, { Component } from "react";
import ReactDOM from "react-dom";
import Toast from "./toast.jsx";
import "./media/sys.css";

// SVG Icons Inline for instant rendering and high quality
const LogsIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="icon">
		<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V-15.75ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
	</svg>
);

const BriefcaseIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="icon">
		<path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 0 1 3.75 18.4V14.15m16.5 0c0-1.286-.833-2.407-2.083-2.73a48.536 48.536 0 0 0-3.005-.518M3.75 14.15c0-1.286.833-2.407 2.083-2.73a48.533 48.533 0 0 1 3.005-.518M12 3c1.31 0 2.391.835 2.79 2.034L18 10.25M12 3a2.99 2.99 0 0 0-2.79 2.034L6 10.25m6-7.25v1.25m0 5v1.25" />
	</svg>
);

const PencilIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="icon-small">
		<path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 18.827a4.755 4.755 0 0 1-2.27 1.255l-3.87.464.464-3.87a4.755 4.755 0 0 1 1.255-2.27L16.862 4.487Zm0 0L19.5 7.125" />
	</svg>
);

const TrashIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="icon-small text-danger">
		<path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
	</svg>
);

const GearIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="icon-header">
		<path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.936 6.936 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
		<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
	</svg>
);

const FilterIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="icon-header">
		<path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
	</svg>
);

const ExportIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="icon-small">
		<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
	</svg>
);

const LinkIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="icon-small text-primary">
		<path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
	</svg>
);

const HamburgerIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="icon">
		<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
	</svg>
);
const RefreshIcon = ({ onClick }) => (
	<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="icon-header clickable" onClick={onClick}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
	</svg>
);

const DocIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="icon-small">
		<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
	</svg>
);

const CloseIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="icon">
		<path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
	</svg>
);

// Format date nicely (e.g., Oct 24, 2023 - 02:17)
const formatDate = (dateInput) => {
	if (!dateInput) return "";
	const date = new Date(dateInput);
	if (isNaN(date.getTime())) return "";
	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	const pad = (numberValue) => numberValue.toString().padStart(2, '0');
	return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} - ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Format date part only (e.g., Oct 24, 2023)
const formatDatePart = (dateInput) => {
	if (!dateInput) return "";
	const date = new Date(dateInput);
	if (isNaN(date.getTime())) return "";
	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

// Format time part only (e.g., 02:17)
const formatTimePart = (dateInput) => {
	if (!dateInput) return "";
	const date = new Date(dateInput);
	if (isNaN(date.getTime())) return "";
	const pad = (numberValue) => numberValue.toString().padStart(2, '0');
	return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Format duration between two times (e.g., 4m 12s)
const formatDuration = (start, end) => {
	if (!start) return "";
	const startTime = new Date(start);
	const endTime = end ? new Date(end) : new Date();
	const diffMs = endTime - startTime;
	if (diffMs < 0) return "0s";
	const totalSecs = Math.floor(diffMs / 1000);
	const mins = Math.floor(totalSecs / 60);
	const secs = totalSecs % 60;
	if (mins > 0) {
		return `${mins}m ${secs}s`;
	}
	return `${secs}s`;
};

// Format frequency seconds to human readable view (e.g. 1 day, 12 hours, 1 hour 30 min)
const formatFrequency = (seconds) => {
	if (!seconds && seconds !== 0) return "";
	const secs = Number(seconds);
	if (isNaN(secs) || secs <= 0) return "0 sec";

	const days = Math.floor(secs / 86400);
	const hours = Math.floor((secs % 86400) / 3600);
	const minutes = Math.floor((secs % 3600) / 60);
	const remainingSeconds = secs % 60;

	const parts = [];
	if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
	if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
	if (minutes > 0) parts.push(`${minutes} min`);
	if (remainingSeconds > 0 && parts.length === 0) {
		parts.push(`${remainingSeconds} sec`);
	}

	return parts.join(" ");
};

// Parse log messages to separate timestamp and content
const parseLogMessage = (msgText) => {
	const match1 = msgText.match(/^(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\s-\s(.*)$/);
	if (match1) {
		return { time: match1[1], text: match1[2] };
	}
	const match2 = msgText.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4})\s+(.*)$/);
	if (match2) {
		const cleanTime = match2[1].replace("T", " ").substring(0, 19);
		return { time: cleanTime, text: match2[2] };
	}
	return { time: "", text: msgText };
};

// Get the latest run time timestamp for a job (0 if no runs)
const getJobLastRunTime = (job) => {
	if (!job || !job.runs || job.runs.length === 0) {
		return 0;
	}
	let latestTimestamp = 0;
	job.runs.forEach((run) => {
		if (run.startTime) {
			const runTimestamp = new Date(run.startTime).getTime();
			if (!isNaN(runTimestamp) && runTimestamp > latestTimestamp) {
				latestTimestamp = runTimestamp;
			}
		}
	});
	return latestTimestamp;
};

// Calculate next run time display for a job
const calculateNextRunTime = (job) => {
	if (!job) return "-";

	// If job has a start time, use it to calculate next occurrence
	if (job.startTime && job.startTime.trim() !== "") {
		const timeParts = job.startTime.trim().split(":");
		if (timeParts.length === 2) {
			const hours = parseInt(timeParts[0], 10);
			const minutes = parseInt(timeParts[1], 10);
			if (!isNaN(hours) && !isNaN(minutes)) {
				const currentDate = new Date();
				const nextRunDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hours, minutes, 0, 0);
				if (nextRunDate <= currentDate) {
					nextRunDate.setDate(nextRunDate.getDate() + 1);
				}
				return formatDate(nextRunDate);
			}
		}
		return job.startTime;
	}

	// If it has a frequency, calculate based off the last run's completeTime
	if (job.frequencySeconds) {
		const frequencyMilliseconds = Number(job.frequencySeconds) * 1000;
		if (!isNaN(frequencyMilliseconds) && frequencyMilliseconds > 0) {
			let latestCompletedTime = null;
			if (job.runs && job.runs.length > 0) {
				job.runs.forEach((run) => {
					if (run.completeTime) {
						const completedTimestamp = new Date(run.completeTime).getTime();
						if (!isNaN(completedTimestamp) && (!latestCompletedTime || completedTimestamp > latestCompletedTime)) {
							latestCompletedTime = completedTimestamp;
						}
					}
				});
			}

			if (latestCompletedTime) {
				const nextRunDate = new Date(latestCompletedTime + frequencyMilliseconds);
				return formatDate(nextRunDate);
			}
		}
	}

	return "-";
};

class Sys extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isLoading: true,
			jobs: [],
			logs: [],
			selectedType: "job", // "job" or "logs"
			selectedJobId: null,
			selectedRunId: null,
			isMobileSidebarOpen: false,
			toast: { text: "", type: "info" },
			
			// Modal visibility flags
			showCreateModal: false,
			showEditModal: false,
			showDeleteConfirm: false,

			// Form fields
			formName: "",
			formScript: "",
			formFrequency: "86400",
			formStartTime: "02:00",
			formStatus: "active",
			formCommand: "Unset"
		};
	}

	componentDidMount() {
		this.loadData();
	}

	// Loads jobs and logs together from the endpoints
	loadData = (selectNewJobId = null) => {
		this.setState({ isLoading: true }, () => {
			Promise.all([
				fetch("/sys/api/getjobs").then(fetchResponse => fetchResponse.ok ? fetchResponse.json() : Promise.reject(fetchResponse.statusText)),
				fetch("/sys/api/getrecentlogs").then(fetchResponse => fetchResponse.ok ? fetchResponse.json() : Promise.reject(fetchResponse.statusText))
			])
			.then(([jobsData, logsData]) => {
				const jobs = jobsData.jobs.map(jobItem => {
					const activeRun = jobItem.runs && jobItem.runs.find(runItem => !runItem.completeTime);
					return {
						...jobItem,
						isRunning: jobItem.status === "active" && !!activeRun
					};
				});

				const logs = logsData.logs.map(logItem => ({
					...logItem,
					logTime: new Date(logItem.logTime),
					dateTime: logItem.logTime ? (new Date(logItem.logTime)).toLocaleDateString() + " " + (new Date(logItem.logTime)).toLocaleTimeString() : ""
				}));

				const nextState = {
					jobs,
					logs,
					isLoading: false
				};

				// Determine selection
				let selectedJobId = selectNewJobId || this.state.selectedJobId;
				if (!selectedJobId && jobs.length > 0) {
					// Default to first active job, or just first job
					const activeJob = jobs.find(jobItem => jobItem.status === "active") || jobs[0];
					selectedJobId = activeJob.id;
				}
				nextState.selectedJobId = selectedJobId;

				// If there's a selected job, set default selected run to its latest run
				const currentJob = jobs.find(jobItem => jobItem.id === selectedJobId);
				if (currentJob && currentJob.runs && currentJob.runs.length > 0) {
					const sortedRuns = [...currentJob.runs].sort((runFirst, runSecond) => new Date(runSecond.startTime) - new Date(runFirst.startTime));
					// Keep previous selectedRunId if it is still valid for this job
					if (!this.state.selectedRunId || !currentJob.runs.some(runItem => runItem._id === this.state.selectedRunId)) {
						nextState.selectedRunId = sortedRuns[0]._id;
					}
				} else {
					nextState.selectedRunId = null;
				}

				this.setState(nextState);
			})
			.catch(errorReason => {
				console.error("Error fetching system configurations:", errorReason);
				this.setState({
					isLoading: false,
					toast: { text: "Error loading system parameters", type: "error" }
				});
			});
		});
	};

	selectJob = (jobId) => {
		const job = this.state.jobs.find(jobItem => jobItem.id === jobId);
		let selectedRunId = null;
		if (job && job.runs && job.runs.length > 0) {
			const sortedRuns = [...job.runs].sort((runFirst, runSecond) => new Date(runSecond.startTime) - new Date(runFirst.startTime));
			selectedRunId = sortedRuns[0]._id;
		}
		this.setState({
			selectedType: "job",
			selectedJobId: jobId,
			selectedRunId: selectedRunId,
			isMobileSidebarOpen: false
		});
	};

	selectLogsView = () => {
		this.setState({
			selectedType: "logs",
			isMobileSidebarOpen: false
		});
	};

	selectRun = (runId) => {
		this.setState({ selectedRunId: runId });
	};

	// Export the messages of the current run as a .txt file download
	exportRunLogs = (jobName, run) => {
		if (!run || !run.messages || run.messages.length === 0) {
			this.setState({ toast: { text: "No logs available to export", type: "info" } });
			return;
		}
		const content = run.messages.map(messageItem => {
			const parsed = parseLogMessage(messageItem.message);
			return `${parsed.time || ""} ${parsed.text}`;
		}).join("\n");
		
		const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `logs_${jobName.toLowerCase().replace(/\s+/g, "_")}_${run._id.slice(-6)}.txt`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		this.setState({ toast: { text: "Logs exported successfully", type: "success" } });
	};

	// Opens Create Job Modal
	openCreateModal = () => {
		this.setState({
			showCreateModal: true,
			formName: "",
			formScript: "",
			formFrequency: "86400",
			formStartTime: "02:00",
			formStatus: "active",
			formCommand: "Unset"
		});
	};

	// Opens Edit Configuration Modal
	openEditModal = (job) => {
		this.setState({
			showEditModal: true,
			formName: job.name || "",
			formScript: job.scriptName || "",
			formFrequency: String(job.frequencySeconds || "86400"),
			formStartTime: job.startTime || "02:00",
			formStatus: job.status || "active",
			formCommand: job.command || "Unset"
		});
	};

	// Handles submission of Create or Edit
	saveJob = (event) => {
		event.preventDefault();
		const { formName, formScript, formFrequency, formStartTime, formStatus, formCommand, showEditModal, selectedJobId } = this.state;
		
		if (!formName.trim() || !formScript.trim()) {
			this.setState({ toast: { text: "Please populate all required fields", type: "error" } });
			return;
		}

		const jobData = {
			name: formName,
			scriptName: formScript,
			frequencySeconds: Number(formFrequency),
			startTime: formStartTime,
			status: formStatus,
			command: formCommand
		};

		if (showEditModal) {
			jobData.id = selectedJobId;
		} else {
			jobData.runs = [];
		}

		fetch("/sys/data/job", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ job: jobData })
		})
		.then(fetchResponse => {
			if (fetchResponse.ok) {
				return fetchResponse.json();
			}
			throw new Error("Failed to save configuration parameters");
		})
		.then(responseData => {
			this.setState({
				showCreateModal: false,
				showEditModal: false,
				toast: { text: showEditModal ? "Job configuration updated" : "Job created successfully", type: "success" }
			});
			this.loadData(responseData.id);
		})
		.catch(errorReason => {
			console.error(errorReason);
			this.setState({ toast: { text: errorReason.message || "Failed to save job configuration", type: "error" } });
		});
	};

	// Triggers deletion
	deleteJob = () => {
		const { selectedJobId } = this.state;
		fetch(`/sys/data/job?id=${selectedJobId}`, {
			method: "DELETE"
		})
		.then(fetchResponse => {
			if (fetchResponse.ok) {
				return fetchResponse.json();
			}
			throw new Error("Failed to delete configuration profile");
		})
		.then(() => {
			this.setState({
				showDeleteConfirm: false,
				selectedJobId: null,
				selectedRunId: null,
				toast: { text: "Configuration profile deleted", type: "success" }
			});
			this.loadData();
		})
		.catch(errorReason => {
			console.error(errorReason);
			this.setState({ toast: { text: errorReason.message || "Failed to delete job", type: "error" } });
		});
	};

	render() {
		const {
			isLoading, jobs, logs, selectedType, selectedJobId, selectedRunId,
			isMobileSidebarOpen, toast, showCreateModal, showEditModal, showDeleteConfirm,
			formName, formScript, formFrequency, formStartTime, formStatus, formCommand
		} = this.state;

		const sortedJobs = [...jobs].sort((jobFirst, jobSecond) => getJobLastRunTime(jobSecond) - getJobLastRunTime(jobFirst));
		const activeJobs = sortedJobs.filter(jobItem => jobItem.status === "active");
		const inactiveJobs = sortedJobs.filter(jobItem => jobItem.status === "inactive");
		const selectedJob = jobs.find(jobItem => jobItem.id === selectedJobId);

		const isJobRunning = showEditModal && selectedJob ? selectedJob.isRunning : false;

		// Format runs and select active run
		const sortedRuns = selectedJob && selectedJob.runs ?
			[...selectedJob.runs].sort((runFirst, runSecond) => new Date(runSecond.startTime) - new Date(runFirst.startTime)) : [];
		
		const selectedRun = sortedRuns.find(runItem => runItem._id === selectedRunId) || sortedRuns[0];

		return (
			<div className="layout-container">
				{/* Mobile Sidebar Overlay background */}
				<div 
					className={`sidebar-overlay ${isMobileSidebarOpen ? "mobile-open" : ""}`}
					onClick={() => this.setState({ isMobileSidebarOpen: false })}
				/>

				{/* Sidebar */}
				<aside className={`sidebar ${isMobileSidebarOpen ? "mobile-open" : ""}`}>
					<div className="sidebar-header">
						<h1 className="sidebar-brand">Admin Panel</h1>
						<p className="sidebar-subbrand">PRECISION OPS</p>
					</div>

					<nav className="sidebar-menu">
						<a 
							className={`sidebar-item clickable ${selectedType === "logs" ? "active" : ""}`}
							onClick={this.selectLogsView}
						>
							<LogsIcon />
							Logs
						</a>

						<div className="sidebar-section-title">Active Jobs</div>
						{activeJobs.map(jobItem => (
							<a 
								key={jobItem.id} 
								className={`sidebar-item clickable ${selectedType === "job" && selectedJobId === jobItem.id ? "active" : ""}`}
								onClick={() => this.selectJob(jobItem.id)}
							>
								<BriefcaseIcon />
								<span>{jobItem.name}</span>
								{jobItem.isRunning && <span className="running-dot" title="Job is running" />}
							</a>
						))}

						{inactiveJobs.length > 0 && (
							<>
								<div className="sidebar-section-title">Inactive Jobs</div>
								{inactiveJobs.map(jobItem => (
									<a 
										key={jobItem.id} 
										className={`sidebar-item clickable ${selectedType === "job" && selectedJobId === jobItem.id ? "active" : ""}`}
										onClick={() => this.selectJob(jobItem.id)}
										style={{ opacity: 0.65 }}
									>
										<BriefcaseIcon />
										<span>{jobItem.name}</span>
										{jobItem.isRunning && <span className="running-dot" title="Job is running" />}
									</a>
								))}
							</>
						)}
					</nav>

					<div className="sidebar-footer">
						<button className="btn-sidebar-refresh" onClick={() => this.loadData()}>
							<RefreshIcon />
							<span style={{ marginLeft: "6px" }}>Refresh</span>
						</button>
						<button className="btn-create-job" onClick={this.openCreateModal}>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: "16px", height: "16px", marginRight: "8px" }}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
							</svg>
							Create Job
						</button>
					</div>
				</aside>

				{/* Main Content Area */}
				<main className="main-content">
					{/* Mobile Navigation Header */}
					<div className="mobile-header">
						<button 
							className="mobile-menu-btn" 
							onClick={() => this.setState({ isMobileSidebarOpen: true })}
						>
							<HamburgerIcon />
						</button>
						<span className="mobile-title">
							{selectedType === "logs" ? "System Logs" : (selectedJob ? selectedJob.name : "System Panel")}
						</span>
						<div style={{ width: "24px" }} /> {/* spacer */}
					</div>

					{isLoading ? (
						<div className="loading-container">
							<div className="spinner"></div>
							<div className="loading-text">Loading Ops Dashboard...</div>
						</div>
					) : (
						<>
							{selectedType === "logs" ? (
								// Logs view
								<div className="general-logs-container">
									<div className="breadcrumbs">LOGS > RECENT</div>
									<div className="job-header-container">
										<div className="job-header-left">
											<div className="job-title-row">
												<h2 className="job-title">Recent System Logs</h2>
											</div>
											<div className="job-subtitle">
												<DocIcon />
												General runtime logging entries across all modular services.
											</div>
										</div>
									</div>

									<div className="dashboard-card">
										<div className="card-header">
											<div className="card-title-group">
												<h3 className="card-title">Console Output</h3>
												<p className="card-subtitle">Showing latest runtime logs</p>
											</div>
											<div className="card-header-actions">
												<RefreshIcon onClick={() => this.loadData()} />
											</div>
										</div>
										<div className="card-body" style={{ padding: "0" }}>
											<div className="log-viewer" style={{ maxHeight: "calc(100vh - 240px)", border: "none", borderRadius: "0" }}>
												{logs.length === 0 ? (
													<div className="no-logs">No system log entries recorded in database.</div>
												) : (
													[...logs]
														.sort((logFirst, logSecond) => logSecond.logTime - logFirst.logTime)
														.map((logItem, logIndex) => {
															const path = (logItem.app || "") + (logItem.app && logItem.module ? "." : "") + (logItem.module || "") + (logItem.module && logItem.function ? "." : "") + (logItem.function || "");
															return (
																<div key={logIndex} className="log-row">
																	<div className="log-time">{logItem.dateTime}</div>
																	<div className="log-msg">
																		<span style={{ color: "#0284c7", fontWeight: "600", marginRight: "8px" }}>[{path}]</span>
																		{logItem.message}
																	</div>
																</div>
															);
														})
												)}
											</div>
										</div>
										<div className="card-footer">
											<span>Total Entries: {logs.length}</span>
											<span>Last Updated: Just Now</span>
										</div>
									</div>
								</div>
							) : (
								// Job Detail view
								selectedJob ? (
									<div>
										<div className="breadcrumbs">JOBS > ID: {selectedJob.id}</div>
										
										<div className="job-header-container">
											<div className="job-header-left">
												<div className="job-title-row">
													<h2 className="job-title">{selectedJob.name}</h2>
													<span className={`badge-status ${selectedJob.status}`}>
														<span style={{ fontSize: "8px", verticalAlign: "middle" }}>●</span> {selectedJob.status}
													</span>
												</div>
												<div className="job-subtitle">
													<DocIcon />
													Active integration: {selectedJob.scriptName}
												</div>
											</div>
											
											<div className="job-header-actions">
												<button 
													className="btn-action btn-danger" 
													onClick={() => this.setState({ showDeleteConfirm: true })}
												>
													<TrashIcon />
													Delete
												</button>
												<button 
													className="btn-action" 
													onClick={() => this.openEditModal(selectedJob)}
												>
													<PencilIcon />
													Edit Config
												</button>
											</div>
										</div>

										{/* Config Parameters card */}
										<div className="dashboard-card">
											<div className="card-header">
												<div className="card-title-group">
													<h3 className="card-title">Config Parameters</h3>
												</div>
											</div>
											<div className="card-body">
												<div className="config-grid">
													<div className="config-item">
														<span className="config-label">Frequency</span>
														<span className="config-value">{formatFrequency(selectedJob.frequencySeconds)}</span>
													</div>
													<div className="config-item">
														<span className="config-label">Start Time</span>
														<span className="config-value">{selectedJob.startTime || "-"}</span>
													</div>
													<div className="config-item">
														<span className="config-label">Status</span>
														<span className={`config-value status-dot ${selectedJob.status}`}>
															{selectedJob.status === "active" ? "Active" : "Inactive"}
														</span>
													</div>
													<div className="config-item">
														<span className="config-label">Command</span>
														<span className="config-value">{selectedJob.command || "Unset"}</span>
													</div>
													<div className="config-item">
														<span className="config-label">Script</span>
														<span className="config-value link">
															{selectedJob.scriptName}
														</span>
													</div>
												</div>
											</div>
										</div>

										{/* Execution History Card */}
										<div className="dashboard-card">
											<div className="card-header">
												<div className="card-title-group">
													<h3 className="card-title">Execution History</h3>
												</div>
												<div className="card-header-actions">
													<span className="next-run-display">
														Next Run: {calculateNextRunTime(selectedJob)}
													</span>
												</div>
											</div>
											<div className="card-body" style={{ padding: "0" }}>
												<div className="table-responsive">
													<table className="data-table">
														<thead>
															<tr>
																<th>Date</th>
																<th>Start</th>
																<th>End</th>
																<th>Duration</th>
																<th># of Messages</th>
															</tr>
														</thead>
														<tbody>
															{sortedRuns.length === 0 ? (
																<tr>
																	<td colSpan="5" style={{ textAlign: "center", color: "#64748b", fontStyle: "italic", padding: "24px" }}>
																		No execution records found for this job.
																	</td>
																</tr>
															) : (
																sortedRuns.map(runItem => {
																	const isSelected = selectedRun && selectedRun._id === runItem._id;
																	const msgCount = runItem.messages ? runItem.messages.length : 0;

																	return (
																		<tr 
																			key={runItem._id} 
																			className={`clickable ${isSelected ? "selected" : ""}`}
																			onClick={() => this.selectRun(runItem._id)}
																		>
																			<td>{formatDatePart(runItem.startTime)}</td>
																			<td>{formatTimePart(runItem.startTime)}</td>
																			<td>{runItem.completeTime ? formatTimePart(runItem.completeTime) : "Running"}</td>
																			<td>{formatDuration(runItem.startTime, runItem.completeTime)}</td>
																			<td>{msgCount}</td>
																		</tr>
																	);
																})
															)}
														</tbody>
													</table>
												</div>
											</div>
										</div>

										{/* Message Log Card */}
										<div className="dashboard-card">
											<div className="card-header">
												<div className="card-title-group">
													<h3 className="card-title">Message Log</h3>
													<p className="card-subtitle">
														{selectedRun ? `Logs for run starting ${formatDate(selectedRun.startTime)}` : "No run selected"}
													</p>
												</div>
												<div className="card-header-actions">
													{selectedRun && (
														<button 
															className="btn-action" 
															onClick={() => this.exportRunLogs(selectedJob.name, selectedRun)}
														>
															<ExportIcon />
															Export
														</button>
													)}
												</div>
											</div>
											<div className="card-body" style={{ padding: "0" }}>
												<div className="log-viewer" style={{ border: "none", borderRadius: "0" }}>
													{!selectedRun || !selectedRun.messages || selectedRun.messages.length === 0 ? (
														<div className="no-logs">No message logs recorded for this run.</div>
													) : (
														selectedRun.messages.map((messageItem, messageIndex) => {
															const parsed = parseLogMessage(messageItem.message);
															const isError = messageItem.severity > 0;
															return (
																<div key={messageIndex} className={`log-row ${isError ? "error" : ""}`}>
																	<div className="log-time">{parsed.time || formatDate(messageItem.time) || "-"}</div>
																	<div className="log-msg">{parsed.text}</div>
																</div>
															);
														})
													)}
												</div>
											</div>
											<div className="card-footer">
												<span>Total Entries: {selectedRun && selectedRun.messages ? selectedRun.messages.length : 0}</span>
												<span>Last Updated: Just Now</span>
											</div>
										</div>
									</div>
								) : (
									<div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
										No jobs configured. Click "+ Create Job" to get started.
									</div>
								)
							)}
						</>
					)}
				</main>

				{/* Create / Edit Modals */}
				{(showCreateModal || showEditModal) && (
					<div className="modal-overlay">
						<div className="modal-card">
							<div className="modal-header">
								<h3 className="modal-title">
									{showEditModal ? "Edit Job Config" : "Create Job Profile"}
								</h3>
								<button 
									className="modal-close-btn"
									onClick={() => this.setState({ showCreateModal: false, showEditModal: false })}
								>
									<CloseIcon />
								</button>
							</div>

							<form onSubmit={this.saveJob}>
								<div className="modal-body">
									<div className="form-group">
										<label className="form-label">Job Name</label>
										<input 
											type="text" 
											className="form-control" 
											placeholder="e.g., Data Sync Alpha"
											value={formName}
											onChange={(event) => this.setState({ formName: event.target.value })}
											required
										/>
									</div>

									<div className="form-group">
										<label className="form-label">Script path</label>
										<input 
											type="text" 
											className="form-control" 
											placeholder="e.g., sync/datasync.py"
											value={formScript}
											onChange={(event) => this.setState({ formScript: event.target.value })}
											required
										/>
										<span className="form-help">Relative path inside server directory.</span>
									</div>

									<div className="form-group">
										<label className="form-label">Frequency (seconds)</label>
										<input 
											type="number" 
											className="form-control" 
											placeholder="e.g., 86400"
											value={formFrequency}
											onChange={(event) => this.setState({ formFrequency: event.target.value })}
											required
										/>
									</div>

									<div className="form-group">
										<label className="form-label">Start Time (HH:MM)</label>
										<input 
											type="text" 
											className="form-control" 
											placeholder="e.g., 02:17"
											value={formStartTime}
											onChange={(event) => this.setState({ formStartTime: event.target.value })}
										/>
										<span className="form-help">Time of execution if frequency matches daily bounds.</span>
									</div>

									<div className="form-group">
										<label className="form-label">Status</label>
										<select 
											className="form-control"
											value={formStatus}
											onChange={(event) => this.setState({ formStatus: event.target.value })}
										>
											<option value="active">Active</option>
											<option value="inactive">Inactive</option>
										</select>
									</div>

									<div className="form-group">
										<label className="form-label">Command</label>
										<select 
											className="form-control"
											value={formCommand}
											onChange={(event) => this.setState({ formCommand: event.target.value })}
										>
											<option value="Unset">Unset</option>
											<option value="Start" disabled={isJobRunning}>Start</option>
											<option value="Stop" disabled={!isJobRunning}>Stop</option>
										</select>
										<span className="form-help">Select manual command for the job execution engine.</span>
									</div>
								</div>

								<div className="modal-footer">
									<button 
										type="button" 
										className="btn-secondary"
										onClick={() => this.setState({ showCreateModal: false, showEditModal: false })}
									>
										Cancel
									</button>
									<button type="submit" className="btn-primary">
										Save Changes
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* Delete Confirmation Modal */}
				{showDeleteConfirm && (
					<div className="modal-overlay">
						<div className="modal-card" style={{ maxWidth: "400px" }}>
							<div className="modal-header">
								<h3 className="modal-title">Delete Job</h3>
								<button 
									className="modal-close-btn"
									onClick={() => this.setState({ showDeleteConfirm: false })}
								>
									<CloseIcon />
								</button>
							</div>
							<div className="modal-body">
								<p style={{ margin: "0", fontSize: "14px", lineHeight: "1.5", color: "#334155" }}>
									Are you sure you want to delete <strong>{selectedJob && selectedJob.name}</strong>? This action will permanently remove the configuration profile and all its execution history.
								</p>
							</div>
							<div className="modal-footer">
								<button 
									className="btn-secondary"
									onClick={() => this.setState({ showDeleteConfirm: false })}
								>
									Cancel
								</button>
								<button 
									className="btn-primary-danger"
									onClick={this.deleteJob}
								>
									Delete Job
								</button>
							</div>
						</div>
					</div>
				)}

				<Toast message={toast} />
			</div>
		);
	}
}

ReactDOM.render(<Sys />, document.getElementById("root"));
