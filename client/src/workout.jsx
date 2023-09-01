import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Toast from "./toast.jsx";
import countdownURL from "./media/workout/countdown.mp3";
import readyURL from "./media/workout/getready.mp3";
import "./media/workout/workout.css";

const Workout = () => {

	const weights = [ 2.5, 5, 10, 25, 35, 45 ];

	const [ hasAccess, setHasAccess ] = useState(true);
	const [ isSaving, setIsSaving ] = useState(false);
	const [ toastMessage, setToastMessage ] = useState({ message: "", type: "info" });

	const [ userId, setUserID ] = useState(null);
	const [ allSets, setAllSets ] = useState([]);
	const [ exercises, setExercises ] = useState([]);

	const [ countdownInterval, setCountdownInterval ] = useState(null);
	const [ startTime, setStartTime ] = useState(null);
	const [ remainMin, setRemainMin ] = useState(null);
	const [ remainSec, setRemainSec ] = useState(null);
	const [ canPlayReady, setCanPlayReady ] = useState(false);
	const [ canPlayComplete, setCanPlayComplete ] = useState(false);
	
	const countdownAudio = new Audio(countdownURL);
	const readyAudio = new Audio(readyURL);
	const restTimeSeconds = 35;

	useEffect(() => {
		if (!userId) {
			
			fetch(`/workout/api/load`)
				.then(response => {
					if (response.ok) {
						return response.json();
					}
					else {
						throw Error(response.statusText);
					}
				})
				.then(data => {
					if (data.isRestricted) {
						setHasAccess(false);
						return;
					}
					
					setHasAccess(true);
					setUserID(data.user.id);
					setExercises(data.exercises
							.concat({ id: "", name: "-- Select Exercise --", category: "" })
							.sort((exerciseA, exerciseB) => exerciseA.name > exerciseB.name ? 1 : -1)
						);

					if (data.lastActivity && data.lastActivity.sets && data.lastActivity.sets.length > 0) {
						setAllSets(data.lastActivity.sets.map(setItem => ({
							...setItem, 
							workoutId: setItem.exercise.id,
							weights: setItem.weight && setItem.exercise ? getWeights(setItem.weight, setItem.exercise) : []
						})));
					}
					else {
						setAllSets([buildNewSet()]);
					}
				})
				.catch(error => {
					console.warn(error);
					setToastMessage({ text: "Error loading", type: "error" })
				});
		}
	}, []);

	const buildNewSet = () => ({
		exercise: null,
		exerciseId: "",
		reps: 0,
		weight: 0,
		weights: []
	});

	const getWeights = (weight, exercise) => {
		const calcWeight = (weight - (exercise.hasBar ? 45 : 0)) / 2;

		return weights
			.sort((weightA, weightB) => weightB - weightA)
			.reduce((output, value) => calcWeight - output.reduce((total, current) => total + current, 0) >= value ? output.concat(value) : output, []);
	};

	const updateTime = () => {
		let min = remainMin,
			sec = remainSec;

		const remainTimer = restTimeSeconds - ((min * 60) + sec),
			remainActual = Math.floor((new Date() - startTime) / 1000);
		
		if (Math.abs(remainActual - remainTimer) > 3) {
			// If the timer (based on interval) is more than 3 seconds off from the actual time difference, then reset the timer
			const newRemain = restTimeSeconds - remainActual;
			min = Math.floor(newRemain / 60);
			sec = Math.floor(newRemain % 60);
		}

		if (sec > 0) {
			sec -= 1;
		}
		else if (min > 0) {
			min -= 1;
			sec = 59;
		}
		console.log(`${ min } min, ${ sec } sec`);

		setRemainMin(min);
		setRemainSec(sec);

		if (sec <= 0 && min <= 0) {
			// Completed
			if (countdownInterval) {
				clearInterval(countdownInterval);
				setCountdownInterval(null);
			}
				
			setAllSets(allSets.map(setItem => ({...setItem, isCountdown: false })));
		}
		else if (canPlayReady && min <= 0 && sec <= 30 && sec > 5) {
			// Play ready audio
			readyAudio.play();
			setCanPlayReady(false);
		}
		else if (canPlayComplete && min <= 0 && sec <= 3) {
			countdownAudio.play();
			setCanPlayReady(false);
			setCanPlayComplete(false);
		}
	};

	const changeExercise = setIndex => event => {
		const exercise = exercises.find(exercise => exercise.id === event.target.value);

		setAllSets(allSets.map((setItem, allIndex) => ({
			...setItem,
			exercise: allIndex !== setIndex ? setItem.exercise : exercise,
			exerciseId: allIndex !== setIndex ? setItem.exerciseId : exercise.id,
			weight: exercise.hasBar ? 45 : 0,
			weights: []
		})));
	};

	const editReps = (setIndex, reps) => {
		setAllSets([
			...allSets.slice(0, setIndex),
			{
				...allSets[setIndex],
				reps: reps
			},
			...allSets.slice(setIndex + 1)
		]);
	};

	const editWeight = (setIndex, weight) => {
		const newWeight = allSets[setIndex].weight + ((weight * 2) * (allSets[setIndex].weights.includes(weight) ? -1 : 1));

		setAllSets([
			...allSets.slice(0, setIndex),
			{
				...allSets[setIndex],
				weight: newWeight,
				weights: getWeights(newWeight, allSets[setIndex].exercise)
			},
			...allSets.slice(setIndex + 1)
		]);
	};

	const completeSet = setIndex => {
		if (countdownInterval) {
			clearInterval(countdownInterval);
		}

		setAllSets([
			...allSets.slice(0, setIndex),
			{
				...allSets[setIndex],
				isComplete: true,
				isCountdown: true
			},
			...allSets.slice(setIndex + 1)
		]);

		if (setIndex < allSets.length) {
			setCanPlayReady(true);
			setCanPlayComplete(true);
			setStartTime(new Date());
			setRemainMin(Math.floor(restTimeSeconds / 60));
			setRemainSec(Math.floor(restTimeSeconds % 60));

			let interval = setInterval(updateTime, 1000)
			setCountdownInterval(interval);
		}
	};
	
	const deleteSet = setIndex => {
		if (allSets.length > 1) {
			setAllSets([
				...allSets.slice(0, setIndex),
				...allSets.slice(setIndex + 1)
			]);
		}
	};

	const addSet = setIndex => {
		setAllSets([
			...allSets.slice(0, setIndex + 1),
			buildNewSet(),
			...allSets.slice(setIndex + 1)
		]);
	};
	
	return (

<div className="page">
	{
	!hasAccess ?

	<div className="loginPage">
		<div className="icon">
			<svg xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 24 24" viewBox="0 0 24 24" fill="black">
				<g>
					<path d="M12,1L3,5v6c0,5.55,3.84,10.74,9,12c5.16-1.26,9-6.45,9-12V5L12,1L12,1z M11,7h2v2h-2V7z M11,11h2v6h-2V11z"/>
				</g>
			</svg>
		</div>
			
		<div className="loginContent">
			<div>
				This is a restricted site that requires pre-approval to use. If you'd like access to this site, please contact the owner.
			</div>
		</div>
	</div>
	
	: !userId ?

	<div className="loading"><img alt="Loading" src="/media/workout/loading.gif" /></div>

	:

	<div className="pageContainer">
		<div className="horizontalContainer">
			
			<div className={`headerButton ${ isSaving || !allSets.some(setItem => setItem.isComplete) ? "disabled" : "" }`}>
				
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="workoutAction">
					<path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
				</svg>
			</div>
			
		</div>
		
		<div className="setsContainer">	
		{
		allSets.map((workoutSet, setIndex) => (
			<div key={setIndex} className="setWrapper">
				<div className="setContainer">
					
					<div className="setHeader">
						<div className="setNameContainer">
							<div className="header">
								<select value={ workoutSet.exerciseId } onChange={ changeExercise(setIndex) }>
									{
									exercises.map(exercise => (
										<option key={exercise.id} value={exercise.id}>{exercise.name}</option>
									))
									}
								</select>
							</div>
							<div className="subHeader">{ workoutSet.exercise ? workoutSet.exercise.category : "" }</div>
						</div>
						
						<div className="setNumberContainer">
							<div>{ setIndex + 1 }</div>
							<div>{ allSets.length }</div>
						</div>
					</div>
					
					{
					workoutSet.exercise ?
					<>
					<div className="setDataContainer">
						<div className="horizontalContainer">
							<div className="dataButton" onClick={ () => editReps(setIndex, workoutSet.reps - 1) }>-</div>
							<div className="dataValue">{ workoutSet.reps }</div>
							<div className="dataButton" onClick={ () => editReps(setIndex, workoutSet.reps + 1) }>+</div>
						</div>
						{
						workoutSet.exercise && workoutSet.exercise.hasWeight ? 
						<div className="horizontalContainer">
							{
							weights.map((weight, weightIndex) =>

							<div key={weightIndex} className={`weightButton ${ workoutSet.weights.includes(weight) ? "active" : "" }`} onClick={ () => editWeight(setIndex, weight) }>{ weight }</div>

							)
							}
						</div>
						: ""
						}
						{
						workoutSet.exercise && workoutSet.exercise.hasWeight ?
						<div className="horizontalContainer">
							<div className="subHeader">{ workoutSet.weight } lbs</div>
						</div>
						: ""
						}
					</div>
					
					<div className="actionContainer">
						<div className="setActionButton" onClick={ () => completeSet(setIndex) }>
						{
						workoutSet.isComplete ?
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"/>
							</svg>
						:
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
							</svg>
						}
						</div>
						
						{
						workoutSet.isComplete ?
						<div className="setComplete">
							{
							workoutSet.isCountdown && (remainMin > 0 || remainSec > 0) ?
								<div>
									<div>{ (remainMin < 10 ? "0" : "") + remainMin }</div>
									<div>{ (remainSec < 10 ? "0" : "") + remainSec }</div>
								</div>
							:
							workoutSet.isComplete && !workoutSet.isCountdown ?
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
									<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
								</svg>
							: ""
							}
						</div>
						: ""
						}
						
						<div className={`setActionButton ${ allSets.length <= 1 ? "disabled" : "" }`} onClick={ () => deleteSet(setIndex) }>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
							</svg>
						</div>
					</div>
					</>
					
					: ""
					}
					
				</div>
				
				<div className="addButton">
					<div onClick={ () => addSet(setIndex) }>+</div>
				</div>
			</div>
		))
		}
		
		</div>
	</div>

	}

	<Toast message={ toastMessage } />
</div>

	);

};

ReactDOM.render(<Workout />, document.getElementById("root"));
export default Workout;
