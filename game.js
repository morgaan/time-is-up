// TODO Swap alerts with dialogs
(function(window, document, undefined) {
	const TimesUp = (function() {
		const settings = {
			gameVersion: JSON.parse(window.localStorage.getItem('gameVersion')),
			nbOfTeams: Number.parseInt(window.localStorage.getItem('nbOfTeams')),
			nbOfWordsToGuess: Number.parseInt(window.localStorage.getItem('nbOfWordsToGuess')),
		};

		let roundsCount;
		let gameDeck;
		let hasImages;
		let state;

		let liveRegionElement;
		let teamPlayingElement;
		let nbOfTeamsElement;
		let currentRoundElement;
		let nbOfRoundsElement;
		let nbOfWordsLeftToSucceedElement;
		let nbOfSucceedElement;
		let nbOfFailedElement;
		let wordElement;
		let wordImageElement;
		let succeedButtonElement;
		let stopButtonElement;
		let failedButtonElement;
		let timerElement;
		let timerVisualElement;
		let timerRemainingElement;

		let previousActiveElement;
		let dialog;
		let dialogMask;
		let dialogWindow;
		let dialogOnCloseCallback;

		let timerHandle;
		let timerEnd = null;

		let timeIsUpSound;
		let failedSound;
		let succeedSound;
		let stopSound;
		let tickSound;

		const roundRules = {
			freeSpeech: {
				rule: `L'orateur parle librement et son équipe fait autant de propositions que nécessaire.`,
				wordSkipAllowed: false,
				shuffle: false
			},
			oneWord: {
				rule: `L'orateur n'a le droit qu'à 1 mot et son équipe qu'à 1 proposition.`,
				wordSkipAllowed: true,
				shuffle: true
			},
			mimeAndSounds: {
				rule: `L'orateur n'a le droit qu'aux mimes et aux bruitages et son équipe qu'à 1 proposition.`,
				wordSkipAllowed: true,
				shuffle: true
			}
		};

		let wordsToSucceedCount = settings.nbOfWordsToGuess;

		// ------------------ INIT  ---------------

		function init(app) {
			UI.queryAllElements();

			roundsCount = settings.gameVersion.rounds.length;
			hasImages = settings.gameVersion.hasImages;
			gameDeck = GAME.createDeck(settings.nbOfWordsToGuess);

			STATE.init();
			UI.setupBoard();
			STATE.proxify();

			// Swaps Loading... with the actual app.
			app.removeAttribute('style');
			liveRegionElement.setAttribute('class', 'sr-only');

			startOfRound();

			UI.setupEvents(app);
		}

		// ------------------ GAME STEPS  ---------------

		function endOfTurn() {
			stopTimer();

			const {rounds} = settings.gameVersion;
			const {
				wordsToSucceed,
				currentRound,
				currentTurn,
			} = state;

			STATE.nextTeam();

			// Resets to move to next turn.
			if (currentTurn.wordsFailed.length > 0) {
				wordsToSucceed.push(...currentTurn.wordsFailed);
			}
			state.currentTurn.wordsSucceed = [];
			state.currentTurn.wordsFailed = [];

			if (wordsToSucceed.length > 0) {
				const roundName = rounds[currentRound.count-1];
				const roundDetails = roundRules[roundName];

				if (roundDetails.shuffle) {
					UTILS.shuffle(state.wordsToSucceed);
					state.wordUnderGuess = state.wordsToSucceed[0];
				}
				wordsToSucceedCount = wordsToSucceed.length;

				alert(`Au tour de l'équipe ${currentTurn.team}`);

				UI.setupBoard();

				startTimer();
			} else {
				endOfRound();
			}
		}

		function startOfRound() {
			const {
				currentRound
			} = state;

			let message = `<h3>Rappel de la règle</h3><p>${currentRound.rule}</p>`;
			message += `<p>C'est au tour de l'équipe ${state.currentTurn.team}</p>`;

			infoDialog(`Début de la manche ${currentRound.count}`, message, 'Commençer !', function startTimerCallback() {
				AUDIO.setupSound(tickSound);
				AUDIO.setupSound(timeIsUpSound);
				startTimer();
			});
		}

		function endOfRound() {
			const {
				currentRound,
				teams,
			} = state;

			let message = `Fin de la manche ${currentRound.count}\n\n`;

			teams.forEach(function appendEndOfRoundMessage(team, index) {
				const score = team.pointsPerRound[currentRound.count-1];
				message += `L'équipe ${index+1} a marqué ${score} point${score > 1 ? 's' : ''}\n`;
			});

			alert(message);

			if (currentRound.count === roundsCount) {
				endOfGame();
			} else {
				STATE.nextRound();

				if (currentRound.count <= roundsCount) {
					UI.setupBoard();
					startOfRound();
				}
			}
		}

		function endOfGame() {
			const totalScores = UTILS.computeRanks(roundsCount, state.teams);

			message = 'Fin de la partie, voici le classement\n\n';

			Object.keys(totalScores).forEach(function appendEndOfGameMessage(team, index) {
				message += `#${index+1} ${team} avec ${totalScores[team]} point${totalScores[team] > 1 ? 's' : ''}\n`
			});

			alert(message);

			location.href = '/index.html';
		}


		// ------------------ USER INTERACTIONS  ---------------

		function onWordFailed() {
			const {
				currentTurn,
				wordsToSucceed
			} = state;
			const succeedWordsCount = currentTurn.wordsSucceed.length;

			wordsToSucceed.shift();
			currentTurn.wordsFailed.push(state.wordUnderGuess);

			const failedWordsCount = currentTurn.wordsFailed.length;
			const totalPlayed = (succeedWordsCount + failedWordsCount);

			if (totalPlayed === wordsToSucceedCount) {
				app.dispatchEvent(new CustomEvent('wordFailed'));
			} else if (totalPlayed < wordsToSucceedCount) {
				const newWord = state.wordsToSucceed[0];
				state.wordUnderGuess = newWord;

				app.dispatchEvent(new CustomEvent('wordFailed', {
					detail: {
						dictionaryEntry: settings.gameVersion.dictionary[newWord],
						newWord
					}
				}));
			}

			failedSound.currentTime = 0;
			failedSound.play();

			if (totalPlayed === wordsToSucceedCount) {
				endOfTurn();
				return;
			}
		}

		function onWordSucceed() {
			const {
				currentTurn,
				wordsToSucceed
			} = state;
			const failedWordsCount = currentTurn.wordsFailed.length;

			wordsToSucceed.shift();
			currentTurn.wordsSucceed.push(state.wordUnderGuess);

			const succeedWordsCount = currentTurn.wordsSucceed.length;
			const totalPlayed = (succeedWordsCount + failedWordsCount);

			if (totalPlayed === wordsToSucceedCount) {
				app.dispatchEvent(new CustomEvent('wordSucceed'));
			} else if (totalPlayed < wordsToSucceedCount) {
				const newWord = state.wordsToSucceed[0];
				state.wordUnderGuess = newWord;

				app.dispatchEvent(new CustomEvent('wordSucceed', {
					detail: {
						dictionaryEntry: settings.gameVersion.dictionary[newWord],
						newWord
					}
				}));
			}

			succeedSound.currentTime = 0;
			succeedSound.play();

			if (totalPlayed === wordsToSucceedCount) {
				endOfTurn();
				return;
			}
		}

		function onStopTurn() {
			stopSound.currentTime = 0;
			stopSound.play();

			endOfTurn();
		}

		// -------------------- STATE ----------------------

		const STATE = {
			init: function() {
				const {rounds, timer} = settings.gameVersion;

				// Proposal state:
				//
				// turnState = {
				//	wordUnderGuess: gameDeck[0],
				//	nbOfSucceed: 0,
				//	nbOfFailed: 0,
				//	timerRemaining: timer,
				// }
				//
				// roundState = {
				//	roundDeck: [...gameDeck], // wordsToSucceed
				//	teamPlaying: 1,
				//	succeed: [],
				//	failed: []
				// }
				//
				// gameState = {
				//	round: 1
				//	rule: roundsRules[rounds[0]].rule,
				//	skipAllowed: roundsRules[rounds[0]].wordSkipAllowed,
				//	timerEnd: null,
				//  scores: [0,0,...]
				// }
				//

				state = {
					wordUnderGuess: gameDeck[0],
					timerRemaining: timer,
					wordsToSucceed: [...gameDeck],
					currentRound: {
						count: 1,
						...roundRules[rounds[0]]
					},
					currentTurn: {
						team: 1,
						wordsSucceed : [],
						wordsFailed : []
					}
				};

				const teams = [];

				for (i = 0; i < settings.nbOfTeams; i++) {
					const pointsPerRound = [];
			
					for (j = 0; j < roundsCount; j++) {
						pointsPerRound.push(0);
					}

					teams.push({
						wordsSucceed: [],
						pointsPerRound
					});
				}

				state.teams = teams;
			},
			proxify: function () {
				state = new Proxy(state, proxyHandler(state));

				function proxyHandler(data) {
					return {
						get: function(obj, prop) {
							if (prop === '_isProxy') {
								return true;
							}

							if (['object', 'array'].includes(Object.prototype.toString.call(obj[prop]).slice(8, -1).toLowerCase()) && !obj[prop]._isProxy) {
								obj[prop] = new Proxy(obj[prop], proxyHandler(data));
							}

							return obj[prop];
						},
						set: function(obj, prop, newValue, rcvr) {
							if (obj[prop] === newValue) {
								return true;
							}

							if (prop === 'wordUnderGuess') {
								const dictionaryEntry = settings.gameVersion.dictionary[newValue];

								obj[prop] = newValue;
								UI.updateWord(newValue, dictionaryEntry);

								return true;
							}

							return Reflect.set(...arguments);
						}
					};
				};
			},
			nextTeam: function () {
				const {
					currentRound,
					currentTurn,
					teams
				} = state;
				const roundOfCurrentTeam = teams[currentTurn.team-1];

				roundOfCurrentTeam.pointsPerRound[currentRound.count-1] = roundOfCurrentTeam.pointsPerRound[currentRound.count-1] + currentTurn.wordsSucceed.length;
				roundOfCurrentTeam.wordsSucceed.push(currentTurn.wordsSucceed);

				if (currentTurn.team === teams.length) {
					state.currentTurn.team = 1;
				} else {
					state.currentTurn.team++;
				}
			},
			nextRound: function () {
				const {rounds} = settings.gameVersion;
				const {
					currentRound,
					currentTurn
				} = state;

				currentRound.count++;
				const newRoundName = rounds[currentRound.count-1];
				const newRoundDetails = roundRules[newRoundName];
				currentRound.rule = newRoundDetails.rule;
				currentRound.wordSkipAllowed = newRoundDetails.wordSkipAllowed;

				UTILS.shuffle(gameDeck);
				state.wordsToSucceed = [...gameDeck];
				wordsToSucceedCount = state.wordsToSucceed.length;
				state.wordUnderGuess = state.wordsToSucceed[0];
			}
		};

		// -------------------- UI ------------------------

		const UI = {
			queryAllElements: function() {
				liveRegionElement = document.querySelector('#live-region');
				teamPlayingElement = app.querySelector('#teamPlaying');
				nbOfTeamsElement = app.querySelector('#nbOfTeams');
				currentRoundElement = app.querySelector('#currentRound');
				nbOfRoundsElement = app.querySelector('#nbOfRounds');
				nbOfWordsLeftToSucceedElement = app.querySelector('#nbOfWordsLeftToSucceed');
				nbOfSucceedElement = app.querySelector('#nbOfSucceed');
				nbOfFailedElement = app.querySelector('#nbOfFailed');
				wordElement = app.querySelector('#word');
				succeedButtonElement = app.querySelector('#succeed');
				failedButtonElement = app.querySelector('#failed');
				stopButtonElement = app.querySelector('#stop');
				timerElement = app.querySelector('#timer');
				timerVisualElement = timerElement.querySelector('#timer-visual');
				timerRemainingElement = timerElement.querySelector('#timer-remaining');
				timeIsUpSound = document.querySelector('#time-is-up-sound');
				failedSound = document.querySelector('#failed-sound');
				succeedSound = document.querySelector('#succeed-sound');
				stopSound = document.querySelector('#stop-sound');
				tickSound = document.querySelector('#tick-sound');
				dialog = document.querySelector('#dialog');
				dialogMask = dialog.querySelector('#dialog-mask');
				dialogWindow = dialog.querySelector('#dialog-window');
			},
			setupBoard: function() {
				const {
					currentTurn,
					teams,
					currentRound,
					wordUnderGuess,
					timer
				} = state;
				const dictionaryEntry = settings.gameVersion.dictionary[wordUnderGuess];

				teamPlayingElement.innerText = currentTurn.team;
				nbOfTeamsElement.innerText = teams.length;
				currentRoundElement.innerText = currentRound.count;
				nbOfRoundsElement.innerText = roundsCount;
				nbOfSucceedElement.innerText = currentTurn.wordsSucceed.length;
				nbOfWordsLeftToSucceedElement.innerText = wordsToSucceedCount;
				nbOfFailedElement.innerText = currentTurn.wordsFailed.length;
				timerVisualElement.style.setProperty('--timer-visual-width', `100%`);
				timerRemainingElement.innerHTML = `${settings.gameVersion.timer}&#8239;<span aria-label="seconds">s</span>`

				if (hasImages && !wordImageElement) {
					const imgElement = document.createElement('img');
					imgElement.id = 'image';
					imgElement.classList.add('c-word__image');
					imgElement.src = `./images/${dictionaryEntry.img}`;
					imgElement.alt = `${wordUnderGuess}${wordUnderGuess !== dictionaryEntry.desc ? `: ${dictionaryEntry.desc}` : wordUnderGuess}`;
					wordElement.appendChild(imgElement);
					wordImageElement = wordElement.querySelector('img');
				} else if (hasImages && wordImageElement) {
					wordImageElement.src = `./images/${dictionaryEntry.img}`;
					wordImageElement.alt = `${wordUnderGuess}${wordUnderGuess !== dictionaryEntry.desc ? `: ${dictionaryEntry.desc}` : wordUnderGuess}`;
				}

				if (currentRound.wordSkipAllowed) {
					failedButtonElement.removeAttribute('disabled');
				} else {
					failedButtonElement.setAttribute('disabled', true);
				}
			},
			updateWord: function(newWord, dictionaryEntry) {
				if (wordImageElement) {
					wordImageElement.src = `./images/${dictionaryEntry.img}`;
					wordImageElement.alt = `${newWord}${newWord !== dictionaryEntry.desc ? `: ${dictionaryEntry.desc}` : newWord}`;

					liveRegionElement.innerText = `Le nouveau mot est ${newWord}${newWord !== dictionaryEntry.desc ? `, l'image associée contient ${dictionaryEntry.desc}` : ''}`;
				}
				else {
					wordElement.innerText = newWord;
					liveRegionElement.innerText = `Le nouveau mot est ${newWord}`;
				}
			},
			setupEvents: function(app) {
				app.addEventListener('click', clickHandler);
				app.addEventListener('updateTimer', updateTimerHandler);
				app.addEventListener('wordSucceed', wordSucceedHandler);
				app.addEventListener('wordFailed', wordFailedHandler);


				// ---

				function matchesButton(element, button) {
					if (event.target.matches(`#${button.id}`)) {
						return true;
					} else if (event.target.closest('button').matches(`#${button.id}`)) {
						// Handles the click on any children of the button (e.g. svg icon).
						return true;
					}
					return false;
				}

				// --- Event handlers

				function clickHandler (event) {
					if (matchesButton(event, succeedButtonElement)) {
						event.preventDefault();
						onWordSucceed();
					} else if (matchesButton(event, failedButtonElement)) {
						event.preventDefault();
						onWordFailed();
					} else if (matchesButton(event, stopButtonElement)) {
						event.preventDefault();
						onStopTurn();
					}
					return;
				}

				function updateTimerHandler(event) {
					const remaining = event.detail.remaining;
					const percentage = Math.trunc((remaining * 100) / settings.gameVersion.timer);
					timerVisualElement.style.setProperty('--timer-visual-width', `${percentage}%`);
					timerRemainingElement.innerHTML = `${remaining}&#8239;<span aria-label="second${remaining === 1 ? '' : 's'}">s</span>`;
				}

				function wordSucceedHandler(event) {
					const currentSucceedCount = new Number(nbOfSucceedElement.textContent);
					nbOfSucceedElement.textContent = currentSucceedCount + 1;
				}

				function wordFailedHandler(event) {
					const currentFailedCount = new Number(nbOfFailedElement.textContent);
					nbOfFailedElement.textContent = currentFailedCount + 1;
				}
			}
		};	

		// -------------------- AUDIO ------------------

		const AUDIO = {
			setupSound: function(sound) {
				sound.play();
				sound.pause();
				sound.currentTime = 0;
			}
		};

		// -------------------- GAME ------------------

		const GAME = {
			createDeck: function(nbOfWordsToGuess) {
				let deck;

				if (hasImages) {
					deck = Object.keys(settings.gameVersion.dictionary);	
				} else {
					deck = [...settings.gameVersion.dictionary];
				}

				UTILS.shuffle(deck);

				deck = deck.splice(0, nbOfWordsToGuess);

				return deck;
			}
		};

		// ----------------- TIMER ------------------

		function startTimer() {
			let {
				timerRemaining
			} = state;

			timerRemaining = settings.gameVersion.timer;

			const now = new Date().getTime();
			timerEnd = now + (timerRemaining * 1000);

			timerRemainingElement.innerHTML = `${timerRemaining}&#8239;<span aria-label="seconds">s</span>`

			timerHandle = setInterval(countdown, 750);
		}

		function stopTimer() {
			clearInterval(timerHandle);
		}

		function countdown() {
			const now = new Date().getTime();
			let {
				timerRemaining
			} = state;

			const newTimerRemaining = Math.trunc((timerEnd - now)/1000);

			if (timerRemaining === newTimerRemaining) {
				return;
			}

			timerRemaining = newTimerRemaining;

			if (timerRemaining < 10 && timerRemaining >= 0) {
				tickSound.currentTime = 0;
				tickSound.play();
			}

			app.dispatchEvent(new CustomEvent('updateTimer', {
				detail: {
					remaining: timerRemaining
				}
			}));

			if (timerRemaining <= 0) {
				clearInterval(timerHandle);
				timeIsUpSound.currentTime = 0;
				timeIsUpSound.play();
				endOfTurn();
			}
		}

		// ----------------- DIALOG ------------------

		function infoDialog(title, content, buttonLabel, callback) {
			dialogWindow.querySelector('#dialog-title').textContent = title;
			dialogWindow.querySelector('#dialog-content').innerHTML = content;
			dialogWindow.querySelector('#dialog-button').textContent = buttonLabel;

			const button = dialogWindow.querySelector('#dialog-button');
			dialogOnCloseCallback = callback;
			button.addEventListener('click', closeDialog);

			openDialog();
		}

		function openDialog() {
			previousActiveElement = document.activeElement;

			Array.from(document.body.children).forEach(child => {
				if (child !== dialog && ['audio', 'script'].includes(child.tagName)) {
					child.inert = true;
				}
			});

			dialog.classList.add('opened');

			dialogMask.addEventListener('click', closeDialog);
			const button = dialogWindow.querySelector('#dialog-button');
			button.addEventListener('click', closeDialog);
			document.addEventListener('keydown', checkCloseDialog);

			dialog.querySelector('button').focus();
		}

		function checkCloseDialog() {
			// Check for Escape key.
			if (e.keyCode === 27) {
				closeDialog();
			}
		}

		function closeDialog() {
			dialogMask.removeEventListener('click', closeDialog);
			dialogWindow.querySelector('button').removeEventListener('click', closeDialog);
			document.removeEventListener('keydown', checkCloseDialog);

			Array.from(document.body.children).forEach(child => {
				if (child !== dialog && ['audio', 'script'].includes(child.tagName)) {
					child.inert = false;
				}
			});

			dialog.classList.remove('opened');

			previousActiveElement.focus();

			if (dialogOnCloseCallback) {
				dialogOnCloseCallback();
			}

			dialogOnCloseCallback = null;
		}


		// ----------------- UTILS ------------------

		const UTILS = {
			shuffle: function(array) {
				// Fisher-Yates shuffle. (https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)
				for (let i = array.length - 1; i > 0; i--) {
					let j = Math.floor(Math.random() * (i + 1));
					[array[i], array[j]] = [array[j], array[i]];
				}
			},
			computeRanks: function(roundsCount, teams) {
				const totalScores = {};

				teams.forEach(function computeEndOfGameScores(team, index) {
					let totalScore = 0;
					for (let i = 0; i < roundsCount; i++) {
						totalScore += team.pointsPerRound[i];
					}
					totalScores[`Equipe ${index+1}`] = totalScore;
				}, {});

				Object.entries(totalScores).sort(function compareScore(a, b) {
					if (a[1] < b[1]) {
						return -1;
					} else if (a[1] > b[1]) {
						return 1;
					}
					return 0;
				});

				return totalScores;
			}
		};

		return {
			init
		};
	})();

	const app = document.querySelector('#app');

	TimesUp.init(app);

})(window, document, undefined);
