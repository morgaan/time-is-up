// The browser will limit the number of concurrent audio contexts
// So be sure to re-use them whenever you can
//
// The magic fallback address delay issue when playing sound in Safari
// Reference: https://stackoverflow.com/questions/9811429/html5-audio-tag-on-safari-has-a-delay/54119854#54119854
const AudioContext = window.AudioContext || window.webkitAudioContext;
const myAudioContext = new AudioContext();

// TODO Swap alerts with dialogs
(function(window, document, undefined) {
	const TimesUp = (function() {
		const settings = {
			gameVersion: JSON.parse(window.localStorage.getItem('gameVersion')),
			numberOfTeams: Number.parseInt(window.localStorage.getItem('numberOfTeams')),
			numberOfWordsToGuess: Number.parseInt(window.localStorage.getItem('numberOfWordsToGuess')),
		};

		let numberOfRounds;
		let gameDeck;
		let hasImages;
		let state;

		let liveRegionElement;
		let teamPlayingElement;
		let numberOfTeamsElement;
		let currentRoundElement;
		let numberOfRoundsElement;
		let numberOfWordsLeftToSucceedElement;
		let numberOfSucceedElement;
		let numberOfFailedElement;
		let wordElement;
		let wordImageElement;
		let wordWordElement;
		let succeedButtonElement;
		let stopButtonElement;
		let failedButtonElement;
		let timerElement;
		let timerVisualElement;
		let timerRemainingElement;
		let failedAudioElement;
		let succeedAudioElement;
		let stopTurnAudioElement;
		let countdownTickAudioElement;
		let timeIsUpAudioElement;
		let endOfGameAudioElement;

		let previousActiveElement;
		let dialog;
		let dialogMask;
		let dialogWindow;
		let dialogOnCloseCallback;

		let timerHandle;
		let timerEnd = null;

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

		let wordsToSucceedCount = settings.numberOfWordsToGuess;

		// ------------------ INIT  ---------------

		function init(app) {
			// These 2 magic lines address delay issue when playing sound in Safari
			// Reference: https://stackoverflow.com/questions/9811429/html5-audio-tag-on-safari-has-a-delay/54119854#54119854
			// const AudioContext = window.AudioContext || window.webkitAudioContext;
			// new AudioContext();

			UI.queryAllElements();

			numberOfRounds = settings.gameVersion.roundsName.length;
			hasImages = settings.gameVersion.hasImages;
			gameDeck = GAME.createDeck(settings.numberOfWordsToGuess);

			STATE.init();
			STATE.proxify();
			UI.setupBoard();

			// Swaps Loading... with the actual app.
			app.removeAttribute('style');
			liveRegionElement.setAttribute('class', 'sr-only');

			startOfRound();

			UI.setupEvents(app);
		}

		// ------------------ GAME STEPS  ---------------

		function endOfTurn() {
			stopTimer();

			const {roundsName} = settings.gameVersion;
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
				const roundName = roundsName[currentRound.count-1];
				const roundDetails = roundRules[roundName];

				if (roundDetails.shuffle) {
					UTILS.shuffle(state.wordsToSucceed);
					state.wordUnderGuess = state.wordsToSucceed[0];
				}
				wordsToSucceedCount = wordsToSucceed.length;

				infoDialog('Changement d\'équipe', `Au tour de l'équipe ${currentTurn.team}`, 'OK !', function setupBoardAndRestartTimer() {
					UI.setupBoard();
					startTimer();
				});
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
				startTimer();
			});
		}

		function endOfRound() {
			const {
				currentRound,
				teams,
			} = state;

			let dialogMessage = '<ul>';
			teams.forEach(function appendEndOfRoundMessage(team, index) {
				const score = team.pointsPerRound[currentRound.count-1];
				dialogMessage += `<li>L'équipe ${index+1} a marqué ${score} point${score > 1 ? 's' : ''}</li>`;
			});
			dialogMessage += '</ul>';

			infoDialog(`Fin de la manche ${currentRound.count}`, dialogMessage, 'OK !', function proceedToNextRoundOrEndOfGame() {
				if (currentRound.count === numberOfRounds) {
					endOfGame();
				} else {
					STATE.nextRound();

					if (currentRound.count <= numberOfRounds) {
						UI.setupBoard();
						startOfRound();
					}
				}
			});
		}

		function endOfGame() {
			AUDIO.endOfGameSound();

			const totalScores = UTILS.computeRanks(numberOfRounds, state.teams);
			let dialogMessage = '';

			let isTie = Object.values(totalScores).every(function areAllTotalScoresEquals(totalScore) {
				return totalScore === Object.values(totalScores)[0];
			});

			if (isTie) {
				const totalScore = Object.values(totalScores)[0];
				dialogMessage = `Toutes les équipes sont à egalité avec ${totalScore} point${totalScore > 1 ? 's' : ''} !`;
			} else {
				dialogMessage = '<ol>';
				Object.keys(totalScores).forEach(function appendEndOfGameMessage(team, index) {
					const totalScore = totalScores[team];
					dialogMessage += `<li>${team} avec ${totalScore} point${totalScore > 1 ? 's' : ''}</li>`;
				});
				dialogMessage += '</ol>';
			}

			infoDialog('Fin de la partie, voici le classement', dialogMessage, 'Recommençer une partie !', function returnToIndex() {
				location.href = `${location.href.match(/^(.*\/)game\./)[1]}settings.html`;
			});
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

			AUDIO.failedSound();

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

			AUDIO.succeedSound();

			if (totalPlayed === wordsToSucceedCount) {
				endOfTurn();
				return;
			}
		}

		function onStopTurn() {
			AUDIO.stopTurnSound();

			endOfTurn();
		}

		// -------------------- STATE ----------------------

		const STATE = {
			init: function() {
				const {roundsName, timer} = settings.gameVersion;

				state = {
					wordUnderGuess: gameDeck[0],
					timerRemaining: timer,
					wordsToSucceed: [...gameDeck],
					currentRound: {
						count: 1,
						...roundRules[roundsName[0]]
					},
					currentTurn: {
						team: 1,
						wordsSucceed : [],
						wordsFailed : []
					}
				};

				const teams = [];

				for (i = 0; i < settings.numberOfTeams; i++) {
					const pointsPerRound = [];
			
					for (j = 0; j < numberOfRounds; j++) {
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
				const {roundsName} = settings.gameVersion;
				const {
					currentRound,
					currentTurn
				} = state;

				currentRound.count++;
				const newRoundName = roundsName[currentRound.count-1];
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
				numberOfTeamsElement = app.querySelector('#numberOfTeams');
				currentRoundElement = app.querySelector('#currentRound');
				numberOfRoundsElement = app.querySelector('#numberOfRounds');
				numberOfWordsLeftToSucceedElement = app.querySelector('#numberOfWordsLeftToSucceed');
				numberOfSucceedElement = app.querySelector('#numberOfSucceed');
				numberOfFailedElement = app.querySelector('#numberOfFailed');
				wordElement = app.querySelector('#word');
				succeedButtonElement = app.querySelector('#succeed');
				failedButtonElement = app.querySelector('#failed');
				stopButtonElement = app.querySelector('#stop');
				timerElement = app.querySelector('#timer');
				timerVisualElement = timerElement.querySelector('#timer-visual');
				timerRemainingElement = timerElement.querySelector('#timer-remaining');
				dialog = document.querySelector('#dialog');
				dialogMask = dialog.querySelector('#dialog-mask');
				dialogWindow = dialog.querySelector('#dialog-window');
				timeIsUpAudioElement = document.querySelector('#time-is-up-audio');
				failedAudioElement = document.querySelector('#failed-audio');
				succeedAudioElement = document.querySelector('#succeed-audio');
				stopTurnAudioElement = document.querySelector('#stop-turn-audio');
				countdownTickAudioElement = document.querySelector('#countdown-tick-audio');
				endOfGameAudioElement = document.querySelector('#end-of-game-audio');
			},
			setupBoard: function() {
				const {
					currentTurn,
					teams,
					currentRound,
					wordUnderGuess,
					wordsToSucceed
				} = state;

				teamPlayingElement.innerText = currentTurn.team;
				numberOfTeamsElement.innerText = teams.length;
				currentRoundElement.innerText = currentRound.count;
				numberOfRoundsElement.innerText = numberOfRounds;
				numberOfSucceedElement.innerText = currentTurn.wordsSucceed.length;
				numberOfWordsLeftToSucceedElement.innerText = wordsToSucceedCount;
				numberOfFailedElement.innerText = currentTurn.wordsFailed.length;
				timerVisualElement.style.setProperty('--timer-visual-width', `100%`);
				timerRemainingElement.innerHTML = `${settings.gameVersion.timer}&#8239;<span aria-label="seconds">s</span>`

				let dictionaryEntry = hasImages ? settings.gameVersion.dictionary[wordUnderGuess] : wordUnderGuess;

				if (hasImages) {
					wordsToSucceed.forEach(function appendLinkToPrefetchImage(word) {
						const {img} = settings.gameVersion.dictionary[word];
						const href = `./images/${img}`;
						const linkElement = document.createElement('link');
						linkElement.rel = 'image preload';
						linkElement.href = href;
						linkElement.as = 'image';
						linkElement.type = "image/svg+xml";
						document.head.appendChild(linkElement);
					});
				}

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
				} else if (!hasImages && !wordWordElement) {
					const spanElement = document.createElement('span');
					spanElement.classList.add('c-word__word');
					spanElement.innerText = wordUnderGuess;
					wordElement.appendChild(spanElement);
					wordWordElement = wordElement.querySelector('span');
				} else if (!hasImages && wordWordElement) {
					spanElement.innerText = wordUnderGuess;
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
					wordWordElement.innerText = newWord;
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
					const currentSucceedCount = new Number(numberOfSucceedElement.textContent);
					numberOfSucceedElement.textContent = currentSucceedCount + 1;
				}

				function wordFailedHandler(event) {
					const currentFailedCount = new Number(numberOfFailedElement.textContent);
					numberOfFailedElement.textContent = currentFailedCount + 1;
				}
			}
		};	

		// -------------------- AUDIO ------------------

		const AUDIO = {
			timeIsUpSound: function () {
				timeIsUpAudioElement.currentTime = 0;
				timeIsUpAudioElement.play();
			},
			failedSound: function () {
				failedAudioElement.currentTime = 0;
				failedAudioElement.play();
			},
			succeedSound: function () {
				succeedAudioElement.currentTime = 0;
				succeedAudioElement.play();
			},
			stopTurnSound: function () {
				stopTurnAudioElement.currentTime = 0;
				stopTurnAudioElement.play();
			},
			tickSound: function () {
				countdownTickAudioElement.currentTime = 0;
				countdownTickAudioElement.play();
			},
			endOfGameSound: function () {
				endOfGameAudioElement.currentTime = 0;
				endOfGameAudioElement.play();
			}
		};

		// -------------------- GAME ------------------

		const GAME = {
			createDeck: function(numberOfWordsToGuess) {
				let deck;

				if (hasImages) {
					deck = Object.keys(settings.gameVersion.dictionary);	
				} else {
					deck = [...settings.gameVersion.dictionary];
				}

				UTILS.shuffle(deck);

				deck = deck.splice(0, numberOfWordsToGuess);

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
				AUDIO.tickSound();
			}

			app.dispatchEvent(new CustomEvent('updateTimer', {
				detail: {
					remaining: timerRemaining
				}
			}));

			if (timerRemaining <= 0) {
				clearInterval(timerHandle);
				AUDIO.timeIsUpSound();
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
			const button = dialogWindow.querySelector('#dialog-button');

			previousActiveElement = document.activeElement;

			Array.from(document.body.children).forEach(child => {
				if (child !== dialog && ['audio', 'script'].includes(child.tagName)) {
					child.inert = true;
				}
			});

			dialog.classList.add('opened');
			dialogMask.addEventListener('click', closeDialog);
			button.addEventListener('click', closeDialog);
			document.addEventListener('keydown', checkCloseDialog);
			dialog.querySelector('button').focus();
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
		}

		function checkCloseDialog() {
			// Check for Escape key.
			if (e.keyCode === 27) {
				closeDialog();
			}
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
			computeRanks: function(numberOfRounds, teams) {
				const totalScores = {};

				teams.forEach(function computeEndOfGameScores(team, index) {
					let totalScore = 0;
					for (let i = 0; i < numberOfRounds; i++) {
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
