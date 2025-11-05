import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./media/vtp.css";

const VirtualTeamParentComponent = () => {
	
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [user, setUser] = useState(null);
	const [error, setError] = useState(null);
	const [isLoading, setIsLoading] = useState(false);

	const [coachBroadcastLoading, setCoachBroadcastLoading] = useState(null);
	const [coachBroadcastResult, setCoachBroadcastResult] = useState(null);
	const [coachBroadcastError, setCoachBroadcastError] = useState(null);

	const [volunteerLoading, setVolunteerLoading] = useState(null);
	const [volunteerResult, setVolunteerResult] = useState(null);
	const [volunteerError, setVolunteerError] = useState(null);

	const [teamFundsLoading, setTeamFundsLoading] = useState(null);
	const [teamFundsResult, setTeamFundsResult] = useState(null);
	const [teamFundsError, setTeamFundsError] = useState(null);

	const [sheetId, setSheetId] = useState(null);
	const [sheetUrl, setSheetUrl] = useState("");
	const [sheetIdLoading, setSheetIdLoading] = useState(null);
	const [sheetIdResult, setSheetIdResult] = useState(null);
	const [sheetIdError, setSheetIdError] = useState(null);

	useEffect(() => {
		const handleMessage = (event) => {
			if (!/^https?:\/\/([a-z0-9-]+\.)*beynum\.com$/.test(event.origin)) {
				return;
			}
			
			if (event.data && event.data.error) {
				setError(event.data.error);
			}
			else if (event.data && event.data.googleName) {
				setUser(event.data);

				if (event.data.indexSheetId) {
					setSheetId(event.data.indexSheetId);
				}

				setIsLoggedIn(true);
				
				window.removeEventListener("message", handleMessage);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, []);

	const openGoogleLogin = () => {
		setError(null);
		window.open("/vtp/auth/google", "Google Login", "width=1000,height=700");
	};

	const saveIndexSheet = async () => {
		setIsLoading(true);
		setSheetIdLoading(true);
		setSheetIdError(null);
		setSheetIdResult(null);

		try {
			const response = await fetch("/vtp/api/saveindexsheet", {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					sheetUrl: sheetUrl,
					userId: user.id
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error (${response.status}): ${ response.statusText }`);
			}

			const data = await response.json();
			if (data.sheetId) {
				setSheetId(data.sheetId);
				setSheetIdResult("Sheet ID Saved");
			}
		}
		catch (error) {
			console.error("Error during save index sheet:", error);
			setSheetIdError("Failed to save index sheet.");
		}
		finally {
			setIsLoading(false);
			setSheetIdLoading(false);
		}
	}

	const coachBroadcast = async () => {
		setIsLoading(true);
		setCoachBroadcastLoading(true);
		setCoachBroadcastError(null);
		setCoachBroadcastResult(null);

		try {
			const response = await fetch("/vtp/api/coachbroadcast?id=" + user.id);
			if (!response.ok) {
				throw new Error(`HTTP error (${response.status}): ${ response.statusText }`);
			}

			const data = await response.json();
			if (data.draftsCreated) {
				setCoachBroadcastResult(`${data.draftsCreated} drafts created.`);
			} else if (data.message) {
				setCoachBroadcastResult(data.message);
			}
		} catch (error) {
			console.error("Error during coach broadcast:", error);
			setCoachBroadcastError("Failed to process coach's email.");
		} finally {
			setIsLoading(false);
			setCoachBroadcastLoading(false);
		}
	};

	const volunteerBroadcast = async () => {
		setIsLoading(true);
		setVolunteerLoading(true);
		setVolunteerError(null);
		setVolunteerResult(null);

		try {
			const response = await fetch("/vtp/api/volunteerbroadcast?id=" + user.id);
			if (!response.ok) {
				throw new Error(`HTTP error (${response.status}): ${ response.statusText }`);
			}

			const data = await response.json();
			if (data.message) {
				setVolunteerResult(data.message);
			}
		} catch (error) {
			console.error("Error during team funds:", error);
			setVolunteerError("Failed to process team funds email.");
		} finally {
			setIsLoading(false);
			setVolunteerLoading(false);
		}
	};

	const teamFunds = async () => {
		setIsLoading(true);
		setTeamFundsLoading(true);
		setTeamFundsError(null);
		setTeamFundsResult(null);

		try {
			const response = await fetch("/vtp/api/teamfunds?id=" + user.id);
			if (!response.ok) {
				throw new Error(`HTTP error (${response.status}): ${ response.statusText }`);
			}

			const data = await response.json();
			if (data.message) {
				setTeamFundsResult(data.message);
			}
		} catch (error) {
			console.error("Error during team funds:", error);
			setTeamFundsError("Failed to process team funds email.");
		} finally {
			setIsLoading(false);
			setTeamFundsLoading(false);
		}
	};

	return (

		isLoggedIn && user ?

		<div className="dashboard-container">
			<div className="dashboard-header">
				<img src="./media/VirtualTeamLogo.png" alt="Virtual Team Parent" className="dashboard-logo" />
				<h1 className="dashboard-title">Virtual Team Parent</h1>
			</div>

			<div className="dashboard-grid">
				<div className="dashboard-card">
					<h2 className="dashboard-card-title">VTP Index Sheet</h2>
					
					<input type="text" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} placeholder="Enter Google Sheet URL" className="dashboard-card-input" />

					<button onClick={ () => saveIndexSheet() } className="dashboard-card-button" disabled={isLoading}>
						{sheetIdLoading ? "Saving..." : "Save"}
					</button>

					{sheetIdResult && (
						<p className="dashboard-card-message">{sheetIdResult}</p>
					)}

					{sheetIdError && <div className="error-message">{sheetIdError}</div>}
				</div>

				<div className="dashboard-card">
					<h2 className="dashboard-card-title">Process Coach's Email</h2>

					{coachBroadcastResult && (
						<p className="dashboard-card-message">{coachBroadcastResult}</p>
					)}
					
					{coachBroadcastError && <div className="error-message">{coachBroadcastError}</div>}

					<button onClick={ () => coachBroadcast() } className="dashboard-card-button" disabled={isLoading || !sheetId}>
						{coachBroadcastLoading ? "Processing..." : "Process"}
					</button>
				</div>
				
				<div className="dashboard-card">
					<h2 className="dashboard-card-title">Send Volunteer Email</h2>
					
					{volunteerResult && (
						<p className="dashboard-card-message">{volunteerResult}</p>
					)}
					
					{volunteerError && <div className="error-message">{volunteerError}</div>}
					
					<button onClick={ () => volunteerBroadcast() } className="dashboard-card-button" disabled={isLoading || !sheetId}>
						{volunteerLoading ? "Processing..." : "Process"}
					</button>
				</div>

				<div className="dashboard-card">
					<h2 className="dashboard-card-title">Send Request Funds Email</h2>

					{teamFundsResult && (
						<p className="dashboard-card-message">{teamFundsResult}</p>
					)}
					
					{teamFundsError && <div className="error-message">{teamFundsError}</div>}

					<button onClick={ () => teamFunds() } className="dashboard-card-button" disabled={isLoading || !sheetId}>
						{teamFundsLoading ? "Processing..." : "Process"}
					</button>
				</div>

				<div className="dashboard-card">
					<h2 className="dashboard-card-title">Send Weekly Coach Email</h2>
					<button className="dashboard-card-button" disabled>Process</button>
				</div>

				<div className="dashboard-card">
					<h2 className="dashboard-card-title">Send Weekly Parent's Email</h2>
					<button className="dashboard-card-button" disabled>Process</button>
				</div>

			</div>
		</div>

		:

		<div className="login-container">
			<img src="./media/VirtualTeamLogo.png" alt="Virtual Team Parent" className="logo" />
			
			{error && <div className="error-message">{error}</div>}
			
			<button onClick={openGoogleLogin} className="login-button">
				Login with Google
			</button>
		</div>

	)
}

ReactDOM.render(<VirtualTeamParentComponent />, document.getElementById("root"));
export default VirtualTeamParentComponent;